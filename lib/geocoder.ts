import { ShanghaiDistrict } from '@/types'

// ─── All 16 administrative districts ─────────────────────────────────────────
export const ALL_DISTRICTS: ShanghaiDistrict[] = [
  'Huangpu', 'Xuhui', 'Changning', "Jing'an", 'Putuo',
  'Hongkou', 'Yangpu', 'Pudong', 'Minhang', 'Baoshan',
  'Jiading', 'Jinshan', 'Songjiang', 'Qingpu', 'Fengxian', 'Chongming',
]

// ─── Adjacency map — used for Day 1 proximity scoring ─────────────────────────
// Two districts are adjacent if they share a border.
export const DISTRICT_ADJACENCY: Record<ShanghaiDistrict, ShanghaiDistrict[]> = {
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

// ─── Common hotel/address aliases → district ──────────────────────────────────
const ALIASES: Record<string, ShanghaiDistrict> = {
  // Romanization variants
  "jingan":          "Jing'an",
  "jing an":         "Jing'an",
  "jing'an":         "Jing'an",
  // Neighbourhood names commonly used in hotel addresses
  "french concession": 'Xuhui',
  "frenchtown":        'Xuhui',
  "xintiandi":         'Xuhui',
  "tianzifang":        'Xuhui',
  "lujiazui":          'Pudong',
  "century park":      'Pudong',
  "pudong airport":    'Pudong',
  "bund":              'Huangpu',
  "old city":          'Huangpu',
  "nanjing road":      'Huangpu',
  "people's square":   'Huangpu',
  "peoples square":    'Huangpu',
  "puxi":              'Huangpu',
  "m50":               'Putuo',
  "suzhou creek":      'Putuo',
  "disney":            'Pudong',
  "disneyland":        'Pudong',
  "hongqiao":          'Changning',
  "hongqiao airport":  'Changning',
  "north bund":        'Hongkou',
  "virtual bund":      'Hongkou',
}

/**
 * Takes a free-text hotel/address input and returns the best-match district.
 * Returns null if nothing matches — caller should fall back to city center.
 */
export function matchHomeDistrict(input: string): ShanghaiDistrict | null {
  if (!input || !input.trim()) return null
  const lower = input.toLowerCase()

  // 1. Check alias map (longest match wins)
  const aliasKeys = Object.keys(ALIASES).sort((a, b) => b.length - a.length)
  for (const alias of aliasKeys) {
    if (lower.includes(alias)) return ALIASES[alias]
  }

  // 2. Check district names directly (case-insensitive substring)
  for (const district of ALL_DISTRICTS) {
    if (lower.includes(district.toLowerCase())) return district
  }

  return null
}
