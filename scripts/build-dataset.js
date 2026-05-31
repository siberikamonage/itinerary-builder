#!/usr/bin/env node
/**
 * build-dataset.js
 * Run once at development time to fetch Shanghai POIs from the Overpass API
 * and write a schema-conformant places.json to public/data/.
 *
 * Usage: node scripts/build-dataset.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// ─── Overpass query ────────────────────────────────────────────────────────────
// Fetches nodes across all major POI categories within Shanghai admin area.
const QUERY = `
[out:json][timeout:90];
area["name"="上海市"]["admin_level"="4"]->.shanghai;
(
  node["tourism"~"museum|attraction|viewpoint|artwork|gallery"](area.shanghai);
  node["historic"~"temple|monument|memorial|ruins|building|archaeological_site"](area.shanghai);
  node["leisure"~"park|garden|nature_reserve|stadium"](area.shanghai);
  node["amenity"="restaurant"]["name"](area.shanghai);
  node["amenity"~"bar|nightclub"]["name"](area.shanghai);
  node["amenity"~"theatre|arts_centre|cinema"]["name"](area.shanghai);
  node["shop"~"mall|department_store|marketplace"]["name"](area.shanghai);
  node["tourism"="hotel"]["name"](area.shanghai);
);
out body;
`

// ─── OSM tag → internal schema mapping ────────────────────────────────────────
const TAG_MAP = [
  // tourism tags
  { match: { tourism: 'museum' },        category: 'museum',       tags: ['art-museums', 'culture-history'] },
  { match: { tourism: 'gallery' },       category: 'gallery',      tags: ['art-museums'] },
  { match: { tourism: 'attraction' },    category: 'landmark',     tags: ['culture-history'] },
  { match: { tourism: 'viewpoint' },     category: 'viewpoint',    tags: ['culture-history', 'hidden-gems'] },
  { match: { tourism: 'artwork' },       category: 'gallery',      tags: ['art-museums', 'hidden-gems'] },
  // historic tags
  { match: { historic: 'temple' },       category: 'temple',       tags: ['culture-history'] },
  { match: { historic: 'monument' },     category: 'landmark',     tags: ['culture-history'] },
  { match: { historic: 'memorial' },     category: 'landmark',     tags: ['culture-history'] },
  { match: { historic: 'ruins' },        category: 'landmark',     tags: ['culture-history', 'hidden-gems'] },
  { match: { historic: 'building' },     category: 'landmark',     tags: ['culture-history'] },
  { match: { historic: 'archaeological_site' }, category: 'landmark', tags: ['culture-history', 'hidden-gems'] },
  // leisure tags
  { match: { leisure: 'park' },          category: 'park',         tags: ['nature-parks', 'family-friendly'] },
  { match: { leisure: 'garden' },        category: 'park',         tags: ['nature-parks', 'family-friendly'] },
  { match: { leisure: 'nature_reserve' },category: 'park',         tags: ['nature-parks'] },
  { match: { leisure: 'stadium' },       category: 'landmark',     tags: ['culture-history'] },
  // amenity tags
  { match: { amenity: 'restaurant' },    category: 'restaurant',   tags: ['food-drink'] },
  { match: { amenity: 'bar' },           category: 'bar',          tags: ['nightlife', 'food-drink'] },
  { match: { amenity: 'nightclub' },     category: 'bar',          tags: ['nightlife'] },
  { match: { amenity: 'theatre' },       category: 'gallery',      tags: ['art-museums', 'culture-history'] },
  { match: { amenity: 'arts_centre' },   category: 'gallery',      tags: ['art-museums'] },
  { match: { amenity: 'cinema' },        category: 'gallery',      tags: ['art-museums', 'family-friendly'] },
  // shop tags
  { match: { shop: 'mall' },             category: 'shopping',     tags: ['shopping'] },
  { match: { shop: 'department_store' }, category: 'shopping',     tags: ['shopping'] },
  { match: { shop: 'marketplace' },      category: 'market',       tags: ['shopping', 'food-drink', 'hidden-gems'] },
]

const DEFAULT_MAPPING = { category: 'landmark', tags: ['culture-history'] }

function getMapping(osmTags) {
  for (const rule of TAG_MAP) {
    const [key, val] = Object.entries(rule.match)[0]
    if (osmTags[key] === val) {
      return { category: rule.category, tags: rule.tags }
    }
  }
  return DEFAULT_MAPPING
}

// ─── District inference from OSM addr tags ─────────────────────────────────────
const KNOWN_DISTRICTS = [
  'Huangpu', 'Xuhui', 'Changning', "Jing'an", 'Jingan', 'Putuo',
  'Hongkou', 'Yangpu', 'Pudong', 'Minhang', 'Baoshan',
  'Jiading', 'Jinshan', 'Songjiang', 'Qingpu', 'Fengxian', 'Chongming',
]

const DISTRICT_ALIASES = {
  'jingan':  "Jing'an",
  "jing'an": "Jing'an",
  'jing an': "Jing'an",
  '静安':    "Jing'an",
  '黄浦':    'Huangpu',
  '徐汇':    'Xuhui',
  '长宁':    'Changning',
  '普陀':    'Putuo',
  '虹口':    'Hongkou',
  '杨浦':    'Yangpu',
  '浦东':    'Pudong',
  '闵行':    'Minhang',
  '宝山':    'Baoshan',
  '嘉定':    'Jiading',
  '金山':    'Jinshan',
  '松江':    'Songjiang',
  '青浦':    'Qingpu',
  '奉贤':    'Fengxian',
  '崇明':    'Chongming',
}

function inferDistrict(osmTags) {
  const candidates = [
    osmTags['addr:district'],
    osmTags['addr:suburb'],
    osmTags['is_in:district'],
    osmTags['is_in'],
  ].filter(Boolean).map(s => s.toLowerCase())

  for (const candidate of candidates) {
    if (DISTRICT_ALIASES[candidate]) return DISTRICT_ALIASES[candidate]
    const match = KNOWN_DISTRICTS.find(d => candidate.includes(d.toLowerCase()))
    if (match) return match === 'Jingan' ? "Jing'an" : match
  }
  return null
}

// ─── Coordinate-based district assignment (fallback when OSM has no addr tags) ──
// Uses nearest-centroid matching against known district geographic centers.
const DISTRICT_CENTROIDS = [
  { district: 'Huangpu',   lat: 31.2285, lng: 121.4820 },
  { district: 'Xuhui',     lat: 31.1884, lng: 121.4364 },
  { district: 'Changning', lat: 31.2204, lng: 121.4043 },
  { district: "Jing'an",   lat: 31.2296, lng: 121.4484 },
  { district: 'Putuo',     lat: 31.2493, lng: 121.4153 },
  { district: 'Hongkou',   lat: 31.2646, lng: 121.4892 },
  { district: 'Yangpu',    lat: 31.2595, lng: 121.5261 },
  { district: 'Pudong',    lat: 31.2213, lng: 121.5446 },
  { district: 'Minhang',   lat: 31.1128, lng: 121.3816 },
  { district: 'Baoshan',   lat: 31.4040, lng: 121.4891 },
  { district: 'Jiading',   lat: 31.3751, lng: 121.2648 },
  { district: 'Songjiang', lat: 31.0189, lng: 121.2279 },
  { district: 'Qingpu',    lat: 31.1499, lng: 121.1247 },
  { district: 'Jinshan',   lat: 30.7417, lng: 121.3411 },
  { district: 'Fengxian',  lat: 30.9209, lng: 121.4741 },
  { district: 'Chongming', lat: 31.6230, lng: 121.3970 },
]

function districtFromCoords(lat, lng) {
  let closest = DISTRICT_CENTROIDS[0]
  let minDist = Infinity
  for (const c of DISTRICT_CENTROIDS) {
    // Euclidean distance in degrees (good enough for this use)
    const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2))
    if (d < minDist) { minDist = d; closest = c }
  }
  return closest.district
}

// ─── Cost level heuristic from OSM tags ───────────────────────────────────────
function inferCostLevel(osmTags, category) {
  const fee = osmTags.fee
  if (fee === 'no' || fee === 'free') return 0

  const priceRange = osmTags.price_range || osmTags['price:range'] || ''
  if (priceRange.includes('$$$') || priceRange.includes('expensive')) return 3
  if (priceRange.includes('$$')) return 2
  if (priceRange.includes('$')) return 1

  // Defaults by category
  const defaults = {
    park:       0,
    temple:     1,
    museum:     2,
    gallery:    1,
    landmark:   0,
    viewpoint:  0,
    restaurant: 1,
    bar:        2,
    shopping:   1,
    market:     1,
  }
  return defaults[category] ?? 1
}

// ─── Visit duration heuristic ─────────────────────────────────────────────────
function inferDuration(category) {
  const durations = {
    museum:     120,
    gallery:    60,
    temple:     45,
    park:       90,
    landmark:   45,
    viewpoint:  30,
    restaurant: 75,
    bar:        90,
    shopping:   90,
    market:     60,
    neighborhood: 90,
  }
  return durations[category] ?? 60
}

// ─── HTTP fetch helper ─────────────────────────────────────────────────────────
function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(query)
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'ShanghaiItineraryBuilder/1.0 (development build)',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`))
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(95000, () => {
      req.destroy(new Error('Request timed out after 95s'))
    })

    req.write(body)
    req.end()
  })
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Querying Overpass API for Shanghai POIs...')
  console.log('(This may take 30–90 seconds)')

  let result
  try {
    result = await fetchOverpass(QUERY)
  } catch (err) {
    console.error('Overpass API request failed:', err.message)
    process.exit(1)
  }

  const elements = result.elements || []
  console.log(`\nRaw elements returned: ${elements.length}`)

  // ── Filter and map to internal schema ──────────────────────────────────────
  const seen = new Set()
  const places = []

  for (const el of elements) {
    if (!el.tags) continue
    if (!el.lat || !el.lon) continue

    const nameEn = el.tags['name:en'] || el.tags['name'] || ''
    const nameZh = el.tags['name:zh'] || el.tags['name'] || ''

    // Require at least some name
    if (!nameEn && !nameZh) continue

    // Deduplicate by English name (lowercased)
    const dedupeKey = (nameEn || nameZh).toLowerCase().trim()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const mapping = getMapping(el.tags)
    const district = inferDistrict(el.tags)

    // Skip if we can't place it in a district — district is required for clustering
    // We'll assign a default in the fallback pass below
    const place = {
      id: `osm-${el.id}`,
      name: {
        en: nameEn || nameZh,
        zh: nameZh || nameEn,
      },
      category: mapping.category,
      tags: mapping.tags,
      district: district || districtFromCoords(el.lat, el.lon),
      lat: el.lat,
      lng: el.lon,
      description: '',              // filled in Day 3 (Wikipedia enrichment)
      visit_duration_min: inferDuration(mapping.category),
      cost_level: inferCostLevel(el.tags, mapping.category),
      image_url: '',                // filled in Day 3
    }

    places.push(place)
  }

  console.log(`After dedup + filtering: ${places.length} places`)

  // ── Per-category cap to prevent restaurant dominance ──────────────────────
  // Restaurants from OSM flood the dataset. Cap each category so no single
  // category drowns out the others in the algorithm's scoring pool.
  const CATEGORY_CAP = {
    restaurant: 200,
    bar:        80,
    shopping:   60,
    museum:     100,
    gallery:    80,
    temple:     80,
    park:       80,
    landmark:   150,
    viewpoint:  60,
    market:     40,
    neighborhood: 30,
  }
  const categoryCounts = {}
  const cappedPlaces = places.filter(p => {
    const cap = CATEGORY_CAP[p.category] ?? 100
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
    return categoryCounts[p.category] <= cap
  })

  console.log(`After category caps: ${cappedPlaces.length} places`)

  // ── Distribution summary ───────────────────────────────────────────────────
  const byTag = {}
  const byDistrict = {}

  for (const place of cappedPlaces) {
    for (const tag of place.tags) {
      byTag[tag] = (byTag[tag] || 0) + 1
    }
    byDistrict[place.district] = (byDistrict[place.district] || 0) + 1
  }

  console.log('\n── Tag distribution ──')
  for (const [tag, count] of Object.entries(byTag).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.min(Math.round(count / 5), 30))
    console.log(`  ${tag.padEnd(20)} ${String(count).padStart(4)}  ${bar}`)
  }

  console.log('\n── District distribution ──')
  for (const [dist, count] of Object.entries(byDistrict).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${dist.padEnd(12)} ${count}`)
  }

  console.log(`\n── Summary ──`)
  console.log(`  Total places:          ${cappedPlaces.length}`)
  console.log(`  Unique tags covered:   ${Object.keys(byTag).length} / 8`)

  if (cappedPlaces.length < 200) {
    console.warn('\n⚠ WARNING: fewer than 200 places. Consider broadening the query or adding manual entries.')
  }

  // ── Write output ───────────────────────────────────────────────────────────
  const outDir = path.join(__dirname, '..', 'public', 'data')
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, 'places.json')
  fs.writeFileSync(outPath, JSON.stringify(cappedPlaces, null, 2))

  console.log(`\n✓ Written to ${outPath}`)
  console.log('Next step: run scripts/enrich-wikipedia.js to add descriptions and images.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
