#!/usr/bin/env node
/**
 * merge-curated.js  —  Day 4
 *
 * Merges the 104 enriched curated places into the main places.json dataset.
 *
 * Rules:
 *   1. Curated places are prepended — they appear first in the array, so the
 *      generator's top-N slice always includes them before OSM equivalents.
 *   2. Idempotent — existing curated IDs (place_001…place_104) are stripped
 *      from places.json before prepending, so re-running is always safe.
 *   3. OSM name dedup — any OSM record whose English name fuzzy-matches a
 *      curated place name is removed to avoid the same place appearing twice.
 *   4. Backup — the previous places.json is saved as places.json.bak before
 *      overwriting.
 *
 * Usage: node scripts/merge-curated.js
 */

const fs   = require('fs')
const path = require('path')

const CURATED_PATH = path.join(__dirname, '..', 'public', 'data', 'curated-enriched.json')
const PLACES_PATH  = path.join(__dirname, '..', 'public', 'data', 'places.json')
const BACKUP_PATH  = PLACES_PATH + '.bak'

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function main() {
  // ── Load inputs ─────────────────────────────────────────────────────────────
  if (!fs.existsSync(CURATED_PATH)) {
    console.error(`✗ Curated data not found: ${CURATED_PATH}`)
    console.error('  Run node scripts/fetch-curated-images.js first.')
    process.exit(1)
  }
  if (!fs.existsSync(PLACES_PATH)) {
    console.error(`✗ Dataset not found: ${PLACES_PATH}`)
    process.exit(1)
  }

  const curated = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf8'))
  const current = JSON.parse(fs.readFileSync(PLACES_PATH, 'utf8'))

  // ── Build dedup sets from curated data ────────────────────────────────────
  const curatedIds   = new Set(curated.map(p => p.id))
  const curatedNames = new Set(curated.map(p => normalize(p.name.en)))

  // ── Strip any existing curated records from the current dataset ───────────
  const osmOnly = current.filter(p => {
    if (curatedIds.has(p.id))                        return false  // already curated ID
    if (curatedNames.has(normalize(p.name.en)))      return false  // name duplicate
    return true
  })

  const removed = current.length - osmOnly.length

  // ── Merge: curated first, then OSM remainder ──────────────────────────────
  const merged = [...curated, ...osmOnly]

  // ── Backup + write ────────────────────────────────────────────────────────
  fs.copyFileSync(PLACES_PATH, BACKUP_PATH)
  fs.writeFileSync(PLACES_PATH, JSON.stringify(merged, null, 2))

  // ── Summary ───────────────────────────────────────────────────────────────
  const withImage  = merged.filter(p => p.image_url && p.image_url !== '').length
  const withHours  = merged.filter(p => p.opening_hours).length
  const isExpected = merged[0].id === 'place_001'

  console.log('── Merge summary ──')
  console.log(`  Curated records prepended : ${curated.length}`)
  console.log(`  OSM records (after dedup) : ${osmOnly.length}  (removed ${removed})`)
  console.log(`  Total in dataset          : ${merged.length}`)
  console.log(`  With image_url            : ${withImage}`)
  console.log(`  With opening_hours        : ${withHours}`)
  console.log(`  First record is place_001 : ${isExpected ? '✓' : '✗ UNEXPECTED'}`)
  console.log(`\n✓ Backup saved to ${BACKUP_PATH}`)
  console.log(`✓ Written to ${PLACES_PATH}`)

  if (!isExpected) {
    console.error('\n✗ First record is not place_001 — something went wrong.')
    process.exit(1)
  }
}

main()
