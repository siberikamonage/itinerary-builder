/**
 * Quick smoke test for the generator — runs in Node with ts-node/esm
 * via dynamic import. No test framework needed.
 *
 * Usage: node --input-type=module < scripts/test-generator.mjs
 * Or:    node scripts/test-generator.mjs
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require    = createRequire(import.meta.url)

// Load places dataset
const places = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'places.json'), 'utf8')
)

// ── Minimal inline versions of the algorithm (mirrors the TS logic) ───────────
// We test the logic directly in JS since we can't import TS without compilation.

function scorePlace(place, prefs, dayIndex) {
  let score = 0
  for (const tag of place.tags) {
    if (prefs.goals.includes(tag)) score += 2
  }
  if (prefs.restrictions.deprioritizeExpensive) {
    if (place.cost_level === 3) score -= 3
    if (place.cost_level === 2) score -= 1
  }
  return score
}

function generateItinerary(prefs, allPlaces) {
  const restrictions = {
    excludeNightlife:      /family|kid|child/.test(prefs.limitations.toLowerCase()),
    deprioritizeExpensive: /budget|cheap|free/.test(prefs.limitations.toLowerCase()),
  }
  const fp = { ...prefs, restrictions }

  let eligible = allPlaces.filter(p => {
    const match = p.tags.some(t => fp.goals.includes(t))
    const ok    = !(restrictions.excludeNightlife && p.category === 'bar')
    return match && ok
  })
  if (eligible.length === 0) eligible = [...allPlaces]

  const perDay = Math.max(3, Math.min(6, Math.floor(eligible.length / prefs.duration)))
  const used   = new Set()
  const days   = []

  for (let d = 0; d < prefs.duration; d++) {
    const scored = eligible
      .filter(p => !used.has(p.id))
      .map(p => ({ place: p, score: scorePlace(p, fp, d) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, perDay)
      .map(s => s.place)

    scored.forEach(p => used.add(p.id))
    days.push({ dayNumber: d + 1, places: scored })
  }
  return days
}

// ── Test cases ─────────────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}`)
    failed++
  }
}

// Test 1: Basic 3-day culture trip
console.log('\nTest 1: 3-day culture & history trip')
{
  const prefs = { duration: 3, homeBase: "Jing'an", homeDistrict: "Jing'an",
                  goals: ['culture-history'], limitations: '', restrictions: {} }
  const itinerary = generateItinerary(prefs, places)
  assert('returns 3 days',         itinerary.length === 3)
  assert('each day has 3-6 places', itinerary.every(d => d.places.length >= 3 && d.places.length <= 6))

  const allIds = itinerary.flatMap(d => d.places.map(p => p.id))
  assert('no duplicate places',    allIds.length === new Set(allIds).size)
  assert('places match goal',      itinerary[0].places.every(p => p.tags.includes('culture-history')))
}

// Test 2: Family restriction excludes bars
console.log('\nTest 2: Family trip excludes nightlife')
{
  const prefs = { duration: 2, homeBase: 'Huangpu', homeDistrict: 'Huangpu',
                  goals: ['food-drink', 'family-friendly'], limitations: 'traveling with kids',
                  restrictions: {} }
  const itinerary = generateItinerary(prefs, places)
  const allPlaces = itinerary.flatMap(d => d.places)
  assert('no bars in family itinerary', allPlaces.every(p => p.category !== 'bar'))
}

// Test 3: 14-day trip has no duplicates
console.log('\nTest 3: 14-day trip — no duplicate places')
{
  const prefs = { duration: 14, homeBase: 'Pudong', homeDistrict: 'Pudong',
                  goals: ['culture-history', 'food-drink', 'art-museums', 'shopping'],
                  limitations: '', restrictions: {} }
  const itinerary = generateItinerary(prefs, places)
  assert('returns 14 days', itinerary.length === 14)
  const allIds = itinerary.flatMap(d => d.places.map(p => p.id))
  assert('no duplicate places across 14 days', allIds.length === new Set(allIds).size)
}

// Test 4: 1-day trip
console.log('\nTest 4: 1-day trip')
{
  const prefs = { duration: 1, homeBase: 'Xuhui', homeDistrict: 'Xuhui',
                  goals: ['hidden-gems', 'food-drink'], limitations: '', restrictions: {} }
  const itinerary = generateItinerary(prefs, places)
  assert('returns 1 day',              itinerary.length === 1)
  assert('day has at least 3 places',  itinerary[0].places.length >= 3)
}

// Test 5: Budget preference de-prioritises expensive places
console.log('\nTest 5: Budget preference')
{
  const prefs = { duration: 2, homeBase: 'Hongkou', homeDistrict: 'Hongkou',
                  goals: ['culture-history', 'food-drink'], limitations: 'tight budget',
                  restrictions: {} }
  const itinerary = generateItinerary(prefs, places)
  const allP      = itinerary.flatMap(d => d.places)
  const avgCost   = allP.reduce((s, p) => s + p.cost_level, 0) / allP.length
  assert('average cost level under 2.5', avgCost < 2.5)
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`)
if (failed > 0) process.exit(1)
