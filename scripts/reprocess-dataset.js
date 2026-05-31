#!/usr/bin/env node
/**
 * reprocess-dataset.js
 * Re-apply the district and category-cap logic to the already-fetched
 * places.json without hitting the Overpass API again.
 * Run: node scripts/reprocess-dataset.js
 */

const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '..', 'public', 'data', 'places.json')
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
console.log(`Loaded ${raw.length} places from existing places.json`)

// ─── District centroids (same as build-dataset.js) ────────────────────────────
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
    const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2))
    if (d < minDist) { minDist = d; closest = c }
  }
  return closest.district
}

// ─── Re-assign districts using coordinate fallback ────────────────────────────
// Only reassign if district is currently defaulted to 'Huangpu' but coordinates
// suggest a different district.
const reassigned = raw.map(place => {
  const coordDistrict = districtFromCoords(place.lat, place.lng)
  return { ...place, district: coordDistrict }
})

console.log('Districts reassigned using coordinate centroids.')

// ─── Remove internal flags from previous run ─────────────────────────────────
const cleaned = reassigned.map(({ _needs_district_review, ...rest }) => rest)

// ─── Per-category cap ─────────────────────────────────────────────────────────
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
const capped = cleaned.filter(p => {
  const cap = CATEGORY_CAP[p.category] ?? 100
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
  return categoryCounts[p.category] <= cap
})

console.log(`After category caps: ${capped.length} places`)

// ─── Distribution report ──────────────────────────────────────────────────────
const byTag = {}
const byDistrict = {}
for (const p of capped) {
  for (const t of p.tags) byTag[t] = (byTag[t] || 0) + 1
  byDistrict[p.district] = (byDistrict[p.district] || 0) + 1
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

// ─── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(dataPath, JSON.stringify(capped, null, 2))
console.log(`\n✓ Reprocessed ${capped.length} places written to ${dataPath}`)
