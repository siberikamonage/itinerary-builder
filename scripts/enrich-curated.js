#!/usr/bin/env node
/**
 * enrich-curated.js  —  Day 2
 *
 * Reads curated-geocoded.json (places + coordinates from Day 1) and produces
 * curated-enriched.json — a fully valid Place array matching types/index.ts.
 *
 * Transformations:
 *   1. Raw tags  →  TripGoal enum  (deduped, min 1 required)
 *   2. Raw category  →  PlaceCategory enum
 *   3. visit_duration_min  →  kept if present, filled from category defaults
 *   4. cost_level  →  kept if present, inferred from tags + category
 *   5. adjacent_districts  →  added from static adjacency table
 *   6. description  →  kept if present, generated as fallback
 *   7. curated: true  →  added to every record
 *   8. Validation  →  exits 1 if any required field is invalid
 *
 * Usage: node scripts/enrich-curated.js
 */

const fs   = require('fs')
const path = require('path')

const IN_PATH  = path.join(__dirname, '..', 'public', 'data', 'curated-geocoded.json')
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'curated-enriched.json')

// ─── 1. Tag mapping: raw string → TripGoal ────────────────────────────────────
// Every raw tag maps to exactly one TripGoal value.
// Tags that don't match (e.g. "youth", "michelin") are intentionally handled
// here so no raw tag is silently dropped.
const TAG_MAP = {
  'culture':        'culture-history',
  'history':        'culture-history',
  'architecture':   'culture-history',
  'art':            'art-museums',
  'photography':    'hidden-gems',
  'food':           'food-drink',
  'michelin':       'food-drink',
  'local':          'food-drink',
  'cafe':           'food-drink',
  'shopping':       'shopping',
  'luxury':         'shopping',
  'youth':          'shopping',
  'nightlife':      'nightlife',
  'nature':         'nature-parks',
  'family-friendly':'family-friendly',
  'hidden-gems':    'hidden-gems',
}

function mapTags(rawTags) {
  const result = new Set()
  for (const tag of (rawTags || [])) {
    const mapped = TAG_MAP[tag]
    if (mapped) result.add(mapped)
    // silently ignore unknown tags — they have no TripGoal equivalent
  }
  if (result.size === 0) result.add('culture-history')
  return [...result]
}

// ─── 2. Category mapping: raw string → PlaceCategory ─────────────────────────
const CATEGORY_MAP = {
  // raw values that need remapping
  'historic':     'landmark',
  'attraction':   'landmark',
  'bakery':       'restaurant',
  'cafe':         'restaurant',
  'art':          'gallery',
  // pass-through values already valid in PlaceCategory
  'museum':       'museum',
  'temple':       'temple',
  'park':         'park',
  'restaurant':   'restaurant',
  'bar':          'bar',
  'market':       'market',
  'gallery':      'gallery',
  'landmark':     'landmark',
  'shopping':     'shopping',
  'neighborhood': 'neighborhood',
  'viewpoint':    'viewpoint',
}

function mapCategory(rawCategory) {
  return CATEGORY_MAP[rawCategory] || 'landmark'
}

// ─── 3. visit_duration_min defaults by mapped category ───────────────────────
// Only used when the raw record has no visit_duration_min field.
const DURATION_DEFAULTS = {
  museum:       120,
  gallery:       75,
  temple:        45,
  park:          60,
  landmark:      45,
  viewpoint:     30,
  restaurant:    60,
  bar:           90,
  shopping:      90,
  market:        75,
  neighborhood:  90,
}

// ─── 4. cost_level inference ──────────────────────────────────────────────────
// 0 = free, 1 = budget, 2 = mid, 3 = expensive
// Tag signals take priority over category defaults.
function inferCostLevel(rawTags, mappedCategory) {
  if (rawTags.includes('michelin'))             return 2
  if (rawTags.includes('luxury'))               return 2
  const defaults = {
    museum:       1,
    gallery:      0,
    temple:       1,
    park:         0,
    landmark:     0,
    viewpoint:    0,
    restaurant:   1,
    bar:          2,
    shopping:     1,
    market:       1,
    neighborhood: 1,
  }
  return defaults[mappedCategory] ?? 1
}

// ─── 5. Adjacent districts (mirrors geocoder.ts DISTRICT_ADJACENCY) ──────────
const ADJACENT = {
  'Huangpu':   ["Xuhui", "Jing'an", 'Hongkou', 'Pudong'],
  'Xuhui':     ['Huangpu', 'Changning', 'Minhang', 'Pudong'],
  "Jing'an":   ['Huangpu', 'Changning', 'Putuo', 'Hongkou'],
  'Pudong':    ['Huangpu', 'Xuhui', 'Yangpu'],
  'Hongkou':   ['Huangpu', "Jing'an", 'Yangpu'],
  'Yangpu':    ['Hongkou', "Jing'an", 'Pudong', 'Baoshan'],
  'Changning': ["Jing'an", 'Xuhui', 'Putuo', 'Minhang'],
  'Putuo':     ["Jing'an", 'Changning', 'Baoshan'],
  'Minhang':   ['Xuhui', 'Changning', 'Songjiang', 'Qingpu', 'Fengxian'],
  'Baoshan':   ['Putuo', 'Yangpu', 'Jiading'],
  'Jiading':   ['Baoshan', 'Qingpu', 'Songjiang'],
  'Songjiang': ['Minhang', 'Qingpu', 'Jiading', 'Jinshan', 'Fengxian'],
  'Qingpu':    ['Minhang', 'Jiading', 'Songjiang'],
  'Jinshan':   ['Songjiang', 'Fengxian'],
  'Fengxian':  ['Songjiang', 'Jinshan', 'Minhang'],
  'Chongming': [],
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`✗ Input not found: ${IN_PATH}`)
    console.error('  Run node scripts/geocode-curated.js first.')
    process.exit(1)
  }

  const geocoded = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'))
  console.log(`Read ${geocoded.length} geocoded places\n`)

  const enriched = geocoded.map((place) => {
    const mappedCategory = mapCategory(place.category)
    const mappedTags     = mapTags(place.tags || [])

    // Preserve values that already exist in places-raw.json (e.g. place_093+)
    const duration = (place.visit_duration_min != null)
      ? place.visit_duration_min
      : (DURATION_DEFAULTS[mappedCategory] ?? 60)

    const cost = (place.cost_level != null)
      ? place.cost_level
      : inferCostLevel(place.tags || [], mappedCategory)

    const description = place.description
      || `A ${mappedCategory} located in Shanghai's ${place.district} district.`

    return {
      id:                 place.id,
      name:               place.name,
      category:           mappedCategory,
      tags:               mappedTags,
      district:           place.district,
      adjacent_districts: ADJACENT[place.district] || [],
      ...(place.address ? { address: place.address } : {}),
      lat:                place.lat,
      lng:                place.lng,
      description,
      visit_duration_min: duration,
      cost_level:         cost,
      // Carry forward structured opening_hours where present (place_093+)
      ...(place.opening_hours ? { opening_hours: place.opening_hours } : {}),
      image_url:          '',   // populated in Day 3
      curated:            true,
    }
  })

  // ── Validation ────────────────────────────────────────────────────────────
  const VALID_CATEGORIES = new Set([
    'museum','temple','park','restaurant','bar','market',
    'gallery','landmark','shopping','neighborhood','viewpoint',
  ])
  const VALID_TAGS = new Set([
    'culture-history','food-drink','shopping','nature-parks',
    'nightlife','art-museums','family-friendly','hidden-gems',
  ])
  const REQUIRED = [
    'id','name','category','tags','district','lat','lng',
    'description','visit_duration_min','cost_level',
  ]

  let errors = 0

  for (const p of enriched) {
    for (const field of REQUIRED) {
      const v = p[field]
      if (v === null || v === undefined || v === '') {
        console.error(`  ✗ ${p.id}: missing required field "${field}"`)
        errors++
      }
    }
    if (!VALID_CATEGORIES.has(p.category)) {
      console.error(`  ✗ ${p.id}: invalid category "${p.category}"`)
      errors++
    }
    if (!Array.isArray(p.tags) || p.tags.length === 0) {
      console.error(`  ✗ ${p.id}: tags array is empty`)
      errors++
    }
    for (const tag of p.tags) {
      if (!VALID_TAGS.has(tag)) {
        console.error(`  ✗ ${p.id}: invalid tag "${tag}"`)
        errors++
      }
    }
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') {
      console.error(`  ✗ ${p.id}: lat/lng must be numbers`)
      errors++
    }
    if (p.cost_level < 0 || p.cost_level > 3) {
      console.error(`  ✗ ${p.id}: cost_level ${p.cost_level} out of range 0–3`)
      errors++
    }
  }

  if (errors > 0) {
    console.error(`\n✗ Validation failed with ${errors} error(s). Fix before proceeding.`)
    process.exit(1)
  }

  // ── Distribution summary ──────────────────────────────────────────────────
  const byTag      = {}
  const byCat      = {}
  const byDistrict = {}
  const byCost     = { 0: 0, 1: 0, 2: 0, 3: 0 }

  for (const p of enriched) {
    byCat[p.category]   = (byCat[p.category]   || 0) + 1
    byDistrict[p.district] = (byDistrict[p.district] || 0) + 1
    byCost[p.cost_level]++
    for (const t of p.tags) byTag[t] = (byTag[t] || 0) + 1
  }

  console.log('── TripGoal tag coverage ──')
  for (const [t, n] of Object.entries(byTag).sort((a, b) => b[1] - a[1]))
    console.log(`  ${t.padEnd(18)} ${n}`)

  console.log('\n── PlaceCategory distribution ──')
  for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1]))
    console.log(`  ${c.padEnd(14)} ${n}`)

  console.log('\n── District distribution ──')
  for (const [d, n] of Object.entries(byDistrict).sort((a, b) => b[1] - a[1]))
    console.log(`  ${d.padEnd(12)} ${n}`)

  console.log('\n── Cost level distribution ──')
  console.log(`  Free (0): ${byCost[0]}  Budget (1): ${byCost[1]}  Mid (2): ${byCost[2]}  Expensive (3): ${byCost[3]}`)

  const withDesc = enriched.filter(p => p.description && p.description.length > 30).length
  console.log(`\n── Descriptions ──`)
  console.log(`  Rich descriptions (>30 chars): ${withDesc} / ${enriched.length}`)

  // ── Write output ──────────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2))

  console.log(`\n✓ All ${enriched.length} records valid`)
  console.log(`✓ Written to ${OUT_PATH}`)
  console.log('\nNext: node scripts/fetch-curated-images.js')
}

main()
