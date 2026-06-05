export interface CuratedPlace {
  id: string
  name: { en: string; zh: string }
  category: string
  tags: string[]
  district: string
  address?: string
  description?: string
  notes?: string
}

export interface CuratedDay {
  dayNumber: number
  title: string
  subtitle: string
  emoji: string
  gradient: string
  placeIds: string[]
}

// Day configuration — places grouped by neighbourhood for logical routing
export const DAY_CONFIG: CuratedDay[] = [
  {
    dayNumber: 1,
    title: 'The Bund & Huangpu Core',
    subtitle: 'Iconic waterfront, world-class museums, Michelin dining and the grandest boulevards',
    emoji: '🏛️',
    gradient: 'from-red-500 to-orange-400',
    placeIds: [
      'place_001','place_002','place_004','place_011','place_012',
      'place_019','place_020','place_023','place_040','place_050',
      'place_068','place_069','place_070','place_086','place_092',
      'place_102',
    ],
  },
  {
    dayNumber: 2,
    title: 'Xintiandi, Tianzifang & Inner Huangpu',
    subtitle: 'Digital art, trendy shopping, Shikumen heritage and neighbourhood gems',
    emoji: '🎨',
    gradient: 'from-violet-500 to-purple-400',
    placeIds: [
      'place_005','place_006','place_014','place_016','place_024',
      'place_025','place_026','place_027','place_028','place_032',
      'place_046','place_066','place_071','place_088',
    ],
  },
  {
    dayNumber: 3,
    title: 'French Concession (Xuhui)',
    subtitle: 'Plane-tree-lined streets, café culture, boutique shopping and hidden ivy houses',
    emoji: '🌿',
    gradient: 'from-emerald-500 to-teal-400',
    placeIds: [
      'place_007','place_008','place_017','place_035','place_036',
      'place_037','place_038','place_039','place_041','place_047',
      'place_048','place_049','place_053','place_061','place_075',
      'place_076','place_077','place_078','place_082','place_083',
      'place_084','place_085','place_087','place_091',
    ],
  },
  {
    dayNumber: 4,
    title: "Jing'an District",
    subtitle: 'Sacred temples, photography galleries, artisan bakeries and Suzhou Creek walks',
    emoji: '⛩️',
    gradient: 'from-amber-500 to-yellow-400',
    placeIds: [
      'place_010','place_018','place_030','place_031','place_033',
      'place_034','place_051','place_052','place_059','place_062',
      'place_065','place_067','place_072','place_073','place_074',
      'place_090',
    ],
  },
  {
    dayNumber: 5,
    title: 'Pudong — New Shanghai',
    subtitle: 'Futuristic skyline, world-class museums, luxury open-air shopping',
    emoji: '🌆',
    gradient: 'from-blue-500 to-cyan-400',
    placeIds: [
      'place_003','place_009','place_013','place_015','place_042','place_057',
      'place_096','place_097','place_099','place_100','place_103',
    ],
  },
  {
    dayNumber: 6,
    title: 'Hongkou, Putuo & Suzhou Creek',
    subtitle: 'Art districts, creative factories, local night markets and riverside cafés',
    emoji: '🎭',
    gradient: 'from-indigo-500 to-blue-400',
    placeIds: [
      'place_022','place_043','place_044','place_045','place_054',
      'place_055','place_056','place_063',
    ],
  },
  {
    dayNumber: 7,
    title: 'Changning — Garden Streets',
    subtitle: 'Columbia Circle heritage, Xinhua Road villas and concept bookstores',
    emoji: '🏡',
    gradient: 'from-rose-500 to-pink-400',
    placeIds: [
      'place_029','place_060','place_064','place_079','place_080',
      'place_081','place_089','place_093',
    ],
  },
  {
    dayNumber: 8,
    title: 'Special Trips & Night Markets',
    subtitle: "Day trips and after-dark escapes beyond the city's core",
    emoji: '🌙',
    gradient: 'from-slate-600 to-gray-500',
    placeIds: ['place_021','place_058','place_101','place_104'],
  },
  {
    dayNumber: 9,
    title: 'Theme Parks & Resorts',
    subtitle: 'World-class rides, LEGO adventures and summer water parks on the city outskirts',
    emoji: '🎢',
    gradient: 'from-orange-500 to-yellow-400',
    placeIds: ['place_094','place_095','place_098'],
  },
]

export function buildCuratedDays(allPlaces: CuratedPlace[]): (CuratedDay & { places: CuratedPlace[] })[] {
  const byId = new Map(allPlaces.map(p => [p.id, p]))
  return DAY_CONFIG.map(day => ({
    ...day,
    places: day.placeIds
      .map(id => byId.get(id))
      .filter((p): p is CuratedPlace => Boolean(p)),
  }))
}
