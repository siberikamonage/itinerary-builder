#!/usr/bin/env node
/**
 * geocode-curated.js  —  Day 1
 *
 * Reads places-raw.json and adds lat/lng to every record.
 * Strategy:
 *   1. Hardcoded coordinate table — used for all 104 known place IDs.
 *      This is faster, more reliable for small shops/cafés, and avoids
 *      Nominatim accuracy issues with Chinese alley addresses.
 *   2. Nominatim fallback — called for any ID not in the hardcoded table
 *      so future places added to places-raw.json are geocoded automatically.
 *   3. District centroid last-resort — if Nominatim returns nothing, the
 *      place is placed at the centre of its district (already defined in
 *      build-dataset.js) so it always has valid coordinates.
 *
 * Output: public/data/curated-geocoded.json
 * Progress is saved every 10 records so the script can be safely interrupted.
 *
 * Usage: node scripts/geocode-curated.js
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const RAW_PATH  = path.join(__dirname, '..', '..', 'places-raw.json')
const OUT_PATH  = path.join(__dirname, '..', 'public', 'data', 'curated-geocoded.json')
const DELAY_MS  = 1100   // Nominatim rate limit: 1 req/sec
const BATCH_SAVE = 10

// ─── Hardcoded coordinates for all 104 known place IDs ────────────────────────
// Verified against district addresses and cross-checked with map sources.
// Keys match the id field in places-raw.json.
const KNOWN_COORDS = {
  'place_001': { lat: 31.2400, lng: 121.4905 }, // The Bund
  'place_002': { lat: 31.2302, lng: 121.4737 }, // Shanghai Museum
  'place_003': { lat: 31.2397, lng: 121.4997 }, // Oriental Pearl Tower
  'place_004': { lat: 31.2354, lng: 121.4760 }, // Nanjing Road
  'place_005': { lat: 31.2097, lng: 121.4674 }, // Tianzifang
  'place_006': { lat: 31.2195, lng: 121.4738 }, // Xintiandi
  'place_007': { lat: 31.2100, lng: 121.4473 }, // Wukang Road
  'place_008': { lat: 31.2082, lng: 121.4432 }, // Wukang Mansion
  'place_009': { lat: 31.1930, lng: 121.5050 }, // Qiantan TaiKooLi
  'place_010': { lat: 31.2243, lng: 121.4467 }, // Jing'an Kerry Centre
  'place_011': { lat: 31.2393, lng: 121.4788 }, // Holy Trinity Church
  'place_012': { lat: 31.2415, lng: 121.4770 }, // Shen Bao Newspaper Office
  'place_013': { lat: 30.9044, lng: 121.8730 }, // Haichang Ocean Park
  'place_014': { lat: 31.2355, lng: 121.5010 }, // teamLab Borderless
  'place_015': { lat: 30.8839, lng: 121.9293 }, // Shanghai Astronomy Museum (Lingang)
  'place_016': { lat: 31.2350, lng: 121.5015 }, // Contemporary Art Museum (CAM)
  'place_017': { lat: 31.1970, lng: 121.4260 }, // Wuzhong Market
  'place_018': { lat: 31.2810, lng: 121.4590 }, // Lanling Flower & Bird Market
  'place_019': { lat: 31.2185, lng: 121.4645 }, // Wu You Xian
  'place_020': { lat: 31.2200, lng: 121.4725 }, // Laodi Fang Noodle
  'place_021': { lat: 31.0048, lng: 121.3952 }, // Sijing Night Market
  'place_022': { lat: 31.2590, lng: 121.5080 }, // Awen Night Market
  'place_023': { lat: 31.2183, lng: 121.4680 }, // Weixiangzhai Sesame Noodles
  'place_024': { lat: 31.2190, lng: 121.4720 }, // OUR Bakery
  'place_025': { lat: 31.2355, lng: 121.5020 }, // AMAM LONBAKERY TOWN
  'place_026': { lat: 31.2195, lng: 121.4738 }, // looknow lab
  'place_027': { lat: 31.2200, lng: 121.4700 }, // HARMAY
  'place_028': { lat: 31.2196, lng: 121.4740 }, // HIRONO
  'place_029': { lat: 31.2215, lng: 121.4070 }, // Apolita Bakery
  'place_030': { lat: 31.2243, lng: 121.4470 }, // Butterful and Creamy
  'place_031': { lat: 31.2196, lng: 121.4738 }, // B&C Butter Bread
  'place_032': { lat: 31.2300, lng: 121.4755 }, // HOT CRUSH
  'place_033': { lat: 31.2243, lng: 121.4467 }, // PAPER STONE BAKERY
  'place_034': { lat: 31.2300, lng: 121.4580 }, // Xishu Puffs
  'place_035': { lat: 31.2100, lng: 121.4680 }, // Spot Table
  'place_036': { lat: 31.2120, lng: 121.4620 }, // Oaks 19
  'place_037': { lat: 31.2110, lng: 121.4670 }, // bobac
  'place_038': { lat: 31.2120, lng: 121.4680 }, // Plusone Coffee
  'place_039': { lat: 31.2130, lng: 121.4640 }, // TRIFLE
  'place_040': { lat: 31.2410, lng: 121.4910 }, // Manner Coffee (Bund View)
  'place_041': { lat: 31.2090, lng: 121.4630 }, // Snoozing Kangaroo Coffee
  'place_042': { lat: 31.2220, lng: 121.5020 }, // C Cafe (Naiyun Bookstore)
  'place_043': { lat: 31.2580, lng: 121.4960 }, // Renmin Café (North Bund)
  'place_044': { lat: 31.2500, lng: 121.4330 }, // Old Six / Swing Café
  'place_045': { lat: 31.2600, lng: 121.4800 }, // Qipu Litful Plaza
  'place_046': { lat: 31.2160, lng: 121.4710 }, // TX Huaihai
  'place_047': { lat: 31.2150, lng: 121.4540 }, // Anfu Road
  'place_048': { lat: 31.2152, lng: 121.4542 }, // Wiggle Wiggle
  'place_049': { lat: 31.2153, lng: 121.4540 }, // 13DE MARZO
  'place_050': { lat: 31.2420, lng: 121.4870 }, // Rockbund Art Museum
  'place_051': { lat: 31.2250, lng: 121.4490 }, // Former Residence of He Dong
  'place_052': { lat: 31.2190, lng: 121.4540 }, // Corner Flower Shop
  'place_053': { lat: 31.2120, lng: 121.4640 }, // Green House at Taiyuan & Yongjia
  'place_054': { lat: 31.2580, lng: 121.4965 }, // North Bund Mini Egg Dome
  'place_055': { lat: 31.2463, lng: 121.4404 }, // M50 Creative Park
  'place_056': { lat: 31.2603, lng: 121.4933 }, // 1933 Old Millfun
  'place_057': { lat: 31.2280, lng: 121.5250 }, // EKA Tianwu
  'place_058': { lat: 31.1400, lng: 121.3600 }, // Shanghai Greenhouse Garden (Minhang)
  'place_059': { lat: 31.2495, lng: 121.4610 }, // Suzhewan Wandahui
  'place_060': { lat: 31.2180, lng: 121.4120 }, // Shangshenxinsuo (Columbia Circle)
  'place_061': { lat: 31.1783, lng: 121.4600 }, // Longhua Meeting
  'place_062': { lat: 31.2400, lng: 121.4510 }, // Shankang Li
  'place_063': { lat: 31.2510, lng: 121.4430 }, // Hongshoufang
  'place_064': { lat: 31.2130, lng: 121.4195 }, // Xinhua Road
  'place_065': { lat: 31.2480, lng: 121.4530 }, // Fotografiska Shanghai
  'place_066': { lat: 31.2190, lng: 121.4955 }, // No. 8 Bridge Art Space
  'place_067': { lat: 31.2490, lng: 121.4535 }, // Sihang Warehouse
  'place_068': { lat: 31.2185, lng: 121.4720 }, // Sinan Mansions
  'place_069': { lat: 31.2190, lng: 121.4730 }, // Former Residence of Sun Yat-sen
  'place_070': { lat: 31.2186, lng: 121.4718 }, // Sinan Books
  'place_071': { lat: 31.2166, lng: 121.4690 }, // Fuxing Park
  'place_072': { lat: 31.2280, lng: 121.4530 }, // Ohel Rachel Synagogue
  'place_073': { lat: 31.2283, lng: 121.4535 }, // Rong House (Villa Lumière)
  'place_074': { lat: 31.2284, lng: 121.4533 }, // Tamburins
  'place_075': { lat: 31.2110, lng: 121.4590 }, // Russian Orthodox Cathedral
  'place_076': { lat: 31.2140, lng: 121.4610 }, // Xiangyang Park
  'place_077': { lat: 31.2115, lng: 121.4592 }, // Basuketto
  'place_078': { lat: 31.2118, lng: 121.4600 }, // Tokokun
  'place_079': { lat: 31.2180, lng: 121.4120 }, // Wanwu Bookstore
  'place_080': { lat: 31.2182, lng: 121.4125 }, // Sun Ke Villa
  'place_081': { lat: 31.2130, lng: 121.4205 }, // Xinfu Li (Happiness Lane)
  'place_082': { lat: 31.2090, lng: 121.4620 }, // Libo Garden
  'place_083': { lat: 31.2130, lng: 121.4700 }, // The Normal Bagel
  'place_084': { lat: 31.2135, lng: 121.4705 }, // gubigubi
  'place_085': { lat: 31.2133, lng: 121.4710 }, // Former Residence of Xia Yan
  'place_086': { lat: 31.2192, lng: 121.4732 }, // Zhou Gong Guan
  'place_087': { lat: 31.2080, lng: 121.4605 }, // No. 8 Hengshan Road
  'place_088': { lat: 31.2265, lng: 121.4750 }, // Koreanya
  'place_089': { lat: 31.2182, lng: 121.4122 }, // coffeaSHED
  'place_090': { lat: 31.2250, lng: 121.4480 }, // Drunk Baker
  'place_091': { lat: 31.1785, lng: 121.4603 }, // Longhua Pagoda & Temple
  'place_092': { lat: 31.2192, lng: 121.4728 }, // Haerbin Food Factory
  'place_093': { lat: 31.1963, lng: 121.3668 }, // Shanghai Zoo
  'place_094': { lat: 31.1440, lng: 121.6570 }, // Shanghai Disneyland
  'place_095': { lat: 30.8450, lng: 121.1760 }, // LEGOLAND Shanghai Resort
  'place_096': { lat: 31.2240, lng: 121.5420 }, // Shanghai Museum East
  'place_097': { lat: 30.8839, lng: 121.9293 }, // Shanghai Astronomy Museum (detailed)
  'place_098': { lat: 31.0700, lng: 121.2400 }, // Shanghai Playa Maya Water Park
  'place_099': { lat: 31.2183, lng: 121.5468 }, // Shanghai Science & Technology Museum
  'place_100': { lat: 31.1800, lng: 121.5700 }, // Shanghai Greenhouse Garden (Pudong)
  'place_101': { lat: 30.9050, lng: 121.0650 }, // Fengjing Ancient Town
  'place_102': { lat: 31.2432, lng: 121.4862 }, // Waibaidu Bridge
  'place_103': { lat: 30.8900, lng: 121.7600 }, // Xinchang Ancient Town
  'place_104': { lat: 31.2463, lng: 121.4404 }, // Suzhou Creek Walkway
}

// ─── District centroid fallback (last resort if Nominatim also fails) ─────────
const DISTRICT_CENTROIDS = {
  'Huangpu':   { lat: 31.2285, lng: 121.4820 },
  'Xuhui':     { lat: 31.1884, lng: 121.4364 },
  'Changning': { lat: 31.2204, lng: 121.4043 },
  "Jing'an":   { lat: 31.2296, lng: 121.4484 },
  'Putuo':     { lat: 31.2493, lng: 121.4153 },
  'Hongkou':   { lat: 31.2646, lng: 121.4892 },
  'Yangpu':    { lat: 31.2595, lng: 121.5261 },
  'Pudong':    { lat: 31.2213, lng: 121.5446 },
  'Minhang':   { lat: 31.1128, lng: 121.3816 },
  'Songjiang': { lat: 31.0189, lng: 121.2279 },
  'Jinshan':   { lat: 30.7417, lng: 121.3411 },
}

// ─── Nominatim HTTP helper ────────────────────────────────────────────────────
function nominatimSearch(query) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query)
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${encoded}&format=json&limit=1&addressdetails=0`,
      headers: {
        'User-Agent': 'ShanghaiItineraryBuilder/1.0 (dev)',
        'Accept-Language': 'en',
      },
    }
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const results = JSON.parse(data)
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => { req.destroy(); resolve(null) })
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(RAW_PATH)) {
    console.error(`✗ Source not found: ${RAW_PATH}`)
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'))
  console.log(`Read ${raw.length} places from places-raw.json\n`)

  // Resume from existing output if interrupted mid-run
  let geocoded = []
  if (fs.existsSync(OUT_PATH)) {
    geocoded = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
    console.log(`Resuming — ${geocoded.length} already geocoded\n`)
  }

  const geocodedIds = new Set(geocoded.map(p => p.id))
  const toProcess   = raw.filter(p => !geocodedIds.has(p.id))

  let fromTable     = 0
  let fromNominatim = 0
  let fromCentroid  = 0
  let apiCalls      = 0

  for (let i = 0; i < toProcess.length; i++) {
    const place = toProcess[i]
    const label = `[${geocoded.length + 1}/${raw.length}] ${place.name.en.slice(0, 38).padEnd(38)}`

    // ── Strategy 1: hardcoded table ──────────────────────────────────────────
    if (KNOWN_COORDS[place.id]) {
      const c = KNOWN_COORDS[place.id]
      geocoded.push({ ...place, lat: c.lat, lng: c.lng, coord_source: 'table' })
      process.stdout.write(`${label} ✓ table\n`)
      fromTable++

    } else {
      // ── Strategy 2: Nominatim ─────────────────────────────────────────────
      process.stdout.write(`${label} → nominatim... `)
      apiCalls++

      const queries = [
        `${place.name.en} Shanghai`,
        place.name.en,
        `${place.name.zh} 上海`,
      ]

      let coords = null
      for (const q of queries) {
        coords = await nominatimSearch(q)
        if (coords) break
        await sleep(DELAY_MS)
      }

      if (coords) {
        geocoded.push({ ...place, lat: coords.lat, lng: coords.lng, coord_source: 'nominatim' })
        process.stdout.write(`✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})\n`)
        fromNominatim++
      } else {
        // ── Strategy 3: district centroid ─────────────────────────────────
        const c = DISTRICT_CENTROIDS[place.district] || { lat: 31.2304, lng: 121.4737 }
        geocoded.push({ ...place, lat: c.lat, lng: c.lng, coord_source: 'centroid' })
        process.stdout.write(`⚠ centroid (${place.district})\n`)
        fromCentroid++
      }

      await sleep(DELAY_MS)
    }

    // Save progress every BATCH_SAVE records
    if ((i + 1) % BATCH_SAVE === 0) {
      fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
      fs.writeFileSync(OUT_PATH, JSON.stringify(geocoded, null, 2))
      console.log(`  → progress saved (${geocoded.length} / ${raw.length})\n`)
    }
  }

  // Final save
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(geocoded, null, 2))

  // Validation: every place must have non-null lat/lng
  const missing = geocoded.filter(p => !p.lat || !p.lng)

  console.log('\n── Geocoding summary ──')
  console.log(`  From hardcoded table : ${fromTable}`)
  console.log(`  From Nominatim       : ${fromNominatim}`)
  console.log(`  From district centroid: ${fromCentroid}  ← review these`)
  console.log(`  API calls made       : ${apiCalls}`)
  console.log(`  Missing coordinates  : ${missing.length}`)

  if (missing.length > 0) {
    console.log('\n  ⚠ Places needing manual coord fix:')
    missing.forEach(p => console.log(`    ${p.id}  ${p.name.en}`))
  }

  console.log(`\n✓ Written ${geocoded.length} records to ${OUT_PATH}`)
  console.log('\nCheck: all places in Shanghai bbox (lat 30.7–31.7, lng 121.0–122.2)?')
  const outOfBox = geocoded.filter(p => p.lat < 30.7 || p.lat > 31.7 || p.lng < 121.0 || p.lng > 122.2)
  if (outOfBox.length > 0) {
    console.log('  ⚠ Out-of-box coords:')
    outOfBox.forEach(p => console.log(`    ${p.id} ${p.name.en}  →  ${p.lat}, ${p.lng}`))
  } else {
    console.log('  ✓ All coordinates within Shanghai bounding box')
  }

  console.log('\nNext: node scripts/enrich-curated.js')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
