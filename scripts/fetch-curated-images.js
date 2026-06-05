#!/usr/bin/env node
/**
 * fetch-curated-images.js  —  Day 3
 *
 * Reads curated-enriched.json and adds image_url to each place.
 * Updates curated-enriched.json in-place.
 *
 * Rules:
 *   - NEVER overwrites description — only image_url is touched.
 *   - Skips places that already have a non-empty image_url.
 *   - Saves progress every 10 places so the script can be interrupted.
 *
 * Strategy per place (in order):
 *   1. Hardcoded Wikimedia Commons URL — for 10 iconic places where
 *      Wikipedia finds the wrong article or returns a poor thumbnail.
 *   2. English Wikipedia REST API  →  summary/{name.en}
 *   3. English Wikipedia REST API  →  summary/{name.en + " Shanghai"}
 *   4. Chinese Wikipedia REST API  →  summary/{name.zh}
 *   5. Leave image_url as ""  if all strategies fail.
 *
 * Usage: node scripts/fetch-curated-images.js
 */

const https   = require('https')
const fs      = require('fs')
const path    = require('path')

const DATA_PATH  = path.join(__dirname, '..', 'public', 'data', 'curated-enriched.json')
const DELAY_MS   = 300
const BATCH_SAVE = 10

// ─── Hardcoded Wikimedia Commons images for high-profile places ───────────────
// Used instead of Wikipedia API when the API returns the wrong article or a
// low-quality thumbnail. Verified against the place IDs in places-raw.json.
const HARDCODED_IMAGES = {
  'place_001': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/The_Bund_2013.jpg/1280px-The_Bund_2013.jpg',
  'place_002': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Shanghai_museum_structure.jpg/1280px-Shanghai_museum_structure.jpg',
  'place_003': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Oriental_Pearl_Tower.jpg/800px-Oriental_Pearl_Tower.jpg',
  'place_005': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Tianzifang_Shanghai.jpg/1280px-Tianzifang_Shanghai.jpg',
  'place_008': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Wukang_Building_Shanghai.jpg/800px-Wukang_Building_Shanghai.jpg',
  'place_055': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/M50_Shanghai.jpg/1280px-M50_Shanghai.jpg',
  'place_067': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Sihang_Warehouse_Shanghai.jpg/1280px-Sihang_Warehouse_Shanghai.jpg',
  'place_071': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Fuxing_Park_Shanghai.jpg/1280px-Fuxing_Park_Shanghai.jpg',
  'place_091': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Longhua_Pagoda_Shanghai.jpg/800px-Longhua_Pagoda_Shanghai.jpg',
  'place_094': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Shanghai_Disneyland_Enchanted_Storybook_Castle.jpg/1280px-Shanghai_Disneyland_Enchanted_Storybook_Castle.jpg',
}

// ─── HTTP helper ───────────────────────────────────────────────────────────────
function get(hostname, urlPath) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      path: urlPath,
      headers: {
        'User-Agent': 'ShanghaiItineraryBuilder/1.0 (educational project)',
        'Accept': 'application/json',
      },
      timeout: 8000,
    }
    https.get(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: null }) }
      })
    }).on('error', () => resolve({ status: 0, body: null }))
      .on('timeout', function() { this.destroy(); resolve({ status: 0, body: null }) })
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Wikipedia image fetch ────────────────────────────────────────────────────
// Returns a thumbnail URL string, or null if nothing found.
async function fetchWikiImage(nameEn, nameZh) {
  const attempts = [
    { host: 'en.wikipedia.org', title: nameEn },
    { host: 'en.wikipedia.org', title: nameEn + ' Shanghai' },
    { host: 'zh.wikipedia.org', title: nameZh },
  ].filter(a => a.title && a.title.trim())

  for (const attempt of attempts) {
    const encoded = encodeURIComponent(attempt.title.replace(/ /g, '_'))
    const res = await get(attempt.host, `/api/rest_v1/page/summary/${encoded}`)
    await sleep(DELAY_MS)

    if (res.status === 200 && res.body && res.body.type !== 'disambiguation') {
      const src = res.body.thumbnail?.source
      if (src && src.startsWith('https')) return src
    }
  }
  return null
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`✗ Input not found: ${DATA_PATH}`)
    console.error('  Run node scripts/enrich-curated.js first.')
    process.exit(1)
  }

  const places  = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const total   = places.length
  const toFetch = places.filter(p => !p.image_url || p.image_url === '')

  console.log(`Total places       : ${total}`)
  console.log(`Need image         : ${toFetch.length}`)
  console.log(`Already have image : ${total - toFetch.length}\n`)
  console.log('Fetching images…\n')

  let fromHardcoded = 0
  let fromWikipedia = 0
  let notFound      = 0
  let processed     = 0

  for (let i = 0; i < places.length; i++) {
    const place = places[i]

    // Skip if already has an image
    if (place.image_url && place.image_url !== '') continue

    const label = `[${i + 1}/${total}] ${place.name.en.slice(0, 40).padEnd(40)}`

    // Strategy 1: hardcoded table
    if (HARDCODED_IMAGES[place.id]) {
      places[i] = { ...place, image_url: HARDCODED_IMAGES[place.id] }
      process.stdout.write(`${label} ✓ hardcoded\n`)
      fromHardcoded++
      processed++

    } else {
      // Strategy 2+3+4: Wikipedia API
      process.stdout.write(`${label} → wiki… `)
      const url = await fetchWikiImage(place.name.en, place.name.zh)

      if (url) {
        places[i] = { ...place, image_url: url }
        process.stdout.write(`✓\n`)
        fromWikipedia++
      } else {
        process.stdout.write(`– not found\n`)
        notFound++
      }
      processed++
    }

    // Save progress every BATCH_SAVE places processed
    if (processed % BATCH_SAVE === 0) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(places, null, 2))
      process.stdout.write(`  → saved progress (${processed} processed)\n\n`)
    }
  }

  // Final save
  fs.writeFileSync(DATA_PATH, JSON.stringify(places, null, 2))

  const withImage = places.filter(p => p.image_url && p.image_url !== '').length

  console.log('\n── Image fetch summary ──')
  console.log(`  From hardcoded table : ${fromHardcoded}`)
  console.log(`  From Wikipedia API   : ${fromWikipedia}`)
  console.log(`  Not found            : ${notFound}`)
  console.log(`  Total with image_url : ${withImage} / ${total}`)

  if (notFound > 0) {
    console.log('\n  Places without images (UI will show gradient placeholder):')
    places
      .filter(p => !p.image_url || p.image_url === '')
      .forEach(p => console.log(`    ${p.id}  ${p.name.en}`))
  }

  console.log(`\n✓ Saved to ${DATA_PATH}`)
  console.log('\nNext: node scripts/merge-curated.js')
}

main().catch(err => {
  console.error('\nFatal:', err.message)
  console.log('Progress has been saved. Re-run to continue.')
  process.exit(1)
})
