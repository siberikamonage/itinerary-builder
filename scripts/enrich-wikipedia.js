#!/usr/bin/env node
/**
 * enrich-wikipedia.js
 * Fetches descriptions and thumbnail images from Wikipedia for each place.
 * Safe to run multiple times — skips places that already have a description.
 * Saves progress after every 10 places so it can be safely interrupted.
 *
 * Usage: node scripts/enrich-wikipedia.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'places.json')
const DELAY_MS = 150   // polite delay between Wikipedia requests
const BATCH_SAVE = 10  // save to disk every N places

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function get(hostname, urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path: urlPath,
      headers: {
        'User-Agent': 'ShanghaiItineraryBuilder/1.0 (educational project)',
        'Accept': 'application/json',
      },
    }
    https.get(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: null }) }
      })
    }).on('error', reject)
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Wikipedia summary fetch ──────────────────────────────────────────────────
// Tries English name first, then Chinese name as fallback.
async function fetchWikiSummary(nameEn, nameZh) {
  const attempts = [
    nameEn,
    // Common renamings that help Wikipedia find the right article
    nameEn + ' Shanghai',
    nameZh,
  ].filter(Boolean)

  for (const query of attempts) {
    const encoded = encodeURIComponent(query.replace(/ /g, '_'))
    try {
      const res = await get('en.wikipedia.org', `/api/rest_v1/page/summary/${encoded}`)
      if (res.status === 200 && res.body && res.body.type !== 'disambiguation') {
        const extract = res.body.extract || ''
        // Take first 2 sentences, max 220 chars
        const sentences = extract.split(/(?<=[.!?])\s+/)
        const description = sentences.slice(0, 2).join(' ').slice(0, 220).trim()
        const image_url = res.body.thumbnail?.source || ''
        if (description.length > 20) {
          return { description, image_url, source: 'wikipedia' }
        }
      }
    } catch {
      // network error on this attempt — try next
    }
    await sleep(DELAY_MS)
  }
  return null
}

// ─── Fallback description generator ──────────────────────────────────────────
// Used when Wikipedia has no article for a place.
function fallbackDescription(place) {
  const categoryLabels = {
    museum:       'museum',
    gallery:      'art gallery',
    temple:       'historic temple',
    park:         'public park',
    landmark:     'notable landmark',
    viewpoint:    'scenic viewpoint',
    restaurant:   'restaurant',
    bar:          'bar',
    shopping:     'shopping destination',
    market:       'market',
    neighborhood: 'neighborhood',
  }
  const label = categoryLabels[place.category] || 'attraction'
  return `A ${label} located in Shanghai's ${place.district} district.`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const places = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const total = places.length
  const toEnrich = places.filter(p => !p.description || p.description.length < 20)

  console.log(`Total places: ${total}`)
  console.log(`Need enrichment: ${toEnrich.length}`)
  console.log(`Already enriched: ${total - toEnrich.length}`)
  console.log('Starting Wikipedia enrichment...\n')

  let enriched = 0
  let found = 0
  let skipped = 0

  for (let i = 0; i < places.length; i++) {
    const place = places[i]

    // Skip if already enriched
    if (place.description && place.description.length >= 20) {
      skipped++
      continue
    }

    process.stdout.write(`[${i + 1}/${total}] ${place.name.en.slice(0, 40).padEnd(40)} `)

    const wiki = await fetchWikiSummary(place.name.en, place.name.zh)

    if (wiki) {
      places[i] = {
        ...place,
        description: wiki.description,
        image_url: wiki.image_url || place.image_url || '',
      }
      process.stdout.write(`✓ wiki\n`)
      found++
    } else {
      places[i] = {
        ...place,
        description: fallbackDescription(place),
        image_url: place.image_url || '',
      }
      process.stdout.write(`– fallback\n`)
    }

    enriched++

    // Save progress every BATCH_SAVE places
    if (enriched % BATCH_SAVE === 0) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(places, null, 2))
      process.stdout.write(`  → saved progress (${enriched} enriched)\n`)
    }

    await sleep(DELAY_MS)
  }

  // Final save
  fs.writeFileSync(DATA_PATH, JSON.stringify(places, null, 2))

  console.log('\n── Enrichment complete ──')
  console.log(`  Wikipedia descriptions found: ${found}`)
  console.log(`  Fallback descriptions used:   ${enriched - found}`)
  console.log(`  Already had description:       ${skipped}`)

  const withImage = places.filter(p => p.image_url && p.image_url.length > 5).length
  console.log(`  Places with images:            ${withImage} / ${total}`)
  console.log(`\n✓ Saved to ${DATA_PATH}`)
  console.log('Next step: Day 3 manual curation pass (visit_duration_min, cost_level)')
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  console.log('Progress has been saved. Re-run the script to continue.')
  process.exit(1)
})
