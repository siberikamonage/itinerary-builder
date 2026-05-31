#!/usr/bin/env node
/**
 * add-manual-places.js
 * Adds hand-curated entries for iconic Shanghai landmarks that OSM either
 * missed or has incomplete data for. Safe to run multiple times — skips
 * any place whose ID already exists in the dataset.
 *
 * Usage: node scripts/add-manual-places.js
 */

const fs = require('fs')
const path = require('path')

const DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'places.json')

// ─── Hand-curated iconic places ───────────────────────────────────────────────
const MANUAL_PLACES = [
  // ── Huangpu (Old City / Bund) ─────────────────────────────────────────────
  {
    id: 'manual-the-bund',
    name: { en: 'The Bund', zh: '外滩' },
    category: 'landmark',
    tags: ['culture-history', 'hidden-gems'],
    district: 'Huangpu',
    lat: 31.2400, lng: 121.4905,
    description: "Shanghai's iconic waterfront promenade stretches 1.5km along the Huangpu River, lined with 52 colonial-era buildings facing the glittering Pudong skyline. Best visited at sunset or after dark when both banks are illuminated.",
    visit_duration_min: 60,
    cost_level: 0,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/The_Bund_2013.jpg/1280px-The_Bund_2013.jpg',
  },
  {
    id: 'manual-yu-garden',
    name: { en: 'Yu Garden', zh: '豫园' },
    category: 'park',
    tags: ['culture-history', 'nature-parks', 'family-friendly'],
    district: 'Huangpu',
    lat: 31.2272, lng: 121.4927,
    description: 'A classical Ming Dynasty garden built in 1559, featuring ornate pavilions, rockeries, ponds, and zigzag bridges. The surrounding Old City bazaar is packed with traditional snacks and souvenirs.',
    visit_duration_min: 90,
    cost_level: 1,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Yu_Garden_Shanghai.jpg/1280px-Yu_Garden_Shanghai.jpg',
  },
  {
    id: 'manual-peoples-square',
    name: { en: "People's Square", zh: '人民广场' },
    category: 'landmark',
    tags: ['culture-history', 'family-friendly'],
    district: 'Huangpu',
    lat: 31.2304, lng: 121.4737,
    description: "Shanghai's central civic hub, home to the Shanghai Museum, Shanghai Grand Theatre, and the Urban Planning Exhibition Hall. A great starting point for exploring the city center.",
    visit_duration_min: 45,
    cost_level: 0,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/People%27s_Square_Shanghai.jpg/1280px-People%27s_Square_Shanghai.jpg',
  },
  {
    id: 'manual-shanghai-museum',
    name: { en: 'Shanghai Museum', zh: '上海博物馆' },
    category: 'museum',
    tags: ['culture-history', 'art-museums', 'family-friendly'],
    district: 'Huangpu',
    lat: 31.2300, lng: 121.4737,
    description: "One of China's premier museums with a world-class collection of ancient Chinese art spanning 11 galleries. The bronze, ceramics, and calligraphy collections are particularly outstanding.",
    visit_duration_min: 150,
    cost_level: 0,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Shanghai_museum_structure.jpg/1280px-Shanghai_museum_structure.jpg',
  },
  // ── Xuhui (French Concession) ─────────────────────────────────────────────
  {
    id: 'manual-tianzifang',
    name: { en: 'Tianzifang', zh: '田子坊' },
    category: 'neighborhood',
    tags: ['art-museums', 'shopping', 'food-drink', 'hidden-gems'],
    district: 'Xuhui',
    lat: 31.2097, lng: 121.4674,
    description: 'A labyrinthine arts and crafts enclave hidden inside a 1930s lane house complex. Galleries, boutique cafés, independent fashion shops, and street food stalls fill the narrow alleyways.',
    visit_duration_min: 90,
    cost_level: 1,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Tianzifang_Shanghai.jpg/1280px-Tianzifang_Shanghai.jpg',
  },
  {
    id: 'manual-xintiandi',
    name: { en: 'Xintiandi', zh: '新天地' },
    category: 'neighborhood',
    tags: ['food-drink', 'shopping', 'culture-history'],
    district: 'Xuhui',
    lat: 31.2195, lng: 121.4738,
    description: "A pedestrianized entertainment district built around restored 1920s shikumen (stone gate) townhouses. High-end restaurants, cocktail bars, and boutiques fill the preserved colonial architecture.",
    visit_duration_min: 90,
    cost_level: 2,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Xintiandi_Shanghai.jpg/1280px-Xintiandi_Shanghai.jpg',
  },
  // ── Pudong ────────────────────────────────────────────────────────────────
  {
    id: 'manual-oriental-pearl',
    name: { en: 'Oriental Pearl Tower', zh: '东方明珠塔' },
    category: 'viewpoint',
    tags: ['culture-history', 'family-friendly'],
    district: 'Pudong',
    lat: 31.2397, lng: 121.4997,
    description: "Shanghai's iconic pink-and-purple broadcast tower (468m) with observation decks at three levels and a revolving restaurant. The ground-floor Shanghai History Museum is free with tower entry.",
    visit_duration_min: 90,
    cost_level: 2,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Oriental_Pearl_Tower.jpg/800px-Oriental_Pearl_Tower.jpg',
  },
  {
    id: 'manual-shanghai-tower',
    name: { en: 'Shanghai Tower Observation Deck', zh: '上海中心大厦观光厅' },
    category: 'viewpoint',
    tags: ['hidden-gems', 'family-friendly'],
    district: 'Pudong',
    lat: 31.2355, lng: 121.5013,
    description: "The world's second-tallest building (632m) has the highest observation deck in China on floor 118. On clear days you can see 100km — arrive early morning for the best visibility.",
    visit_duration_min: 60,
    cost_level: 2,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Shanghai_Tower_Construction%2C_January_2014.jpg/800px-Shanghai_Tower_Construction%2C_January_2014.jpg',
  },
  {
    id: 'manual-lujiazui-waterfront',
    name: { en: 'Lujiazui Waterfront', zh: '陆家嘴滨江' },
    category: 'viewpoint',
    tags: ['culture-history', 'nature-parks'],
    district: 'Pudong',
    lat: 31.2370, lng: 121.4980,
    description: "A free riverside promenade offering the best face-on view of The Bund skyline from the Pudong side. The grassy lawns are popular with locals on weekends.",
    visit_duration_min: 45,
    cost_level: 0,
    image_url: '',
  },
  // ── Jing'an ───────────────────────────────────────────────────────────────
  {
    id: 'manual-jingan-temple',
    name: { en: "Jing'an Temple", zh: '静安寺' },
    category: 'temple',
    tags: ['culture-history', 'family-friendly'],
    district: "Jing'an",
    lat: 31.2243, lng: 121.4467,
    description: "A 1,700-year-old Buddhist temple sitting incongruously between luxury malls on Nanjing West Road. The gold-plated main hall and resident monks make this an authentic spiritual experience amid the commercial bustle.",
    visit_duration_min: 45,
    cost_level: 1,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jing%27an_Temple_2013.jpg/1280px-Jing%27an_Temple_2013.jpg',
  },
  {
    id: 'manual-m50',
    name: { en: 'M50 Art District', zh: 'M50创意园' },
    category: 'gallery',
    tags: ['art-museums', 'hidden-gems'],
    district: 'Putuo',
    lat: 31.2463, lng: 121.4404,
    description: "Shanghai's most established contemporary art cluster, housed in 1930s cotton-mill buildings along Suzhou Creek. Over 100 galleries and studios represent both established and emerging Chinese artists.",
    visit_duration_min: 90,
    cost_level: 0,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/M50_Shanghai.jpg/1280px-M50_Shanghai.jpg',
  },
  // ── Hongkou ───────────────────────────────────────────────────────────────
  {
    id: 'manual-1933-slaughterhouse',
    name: { en: '1933 Old Millfun', zh: '1933老场坊' },
    category: 'gallery',
    tags: ['art-museums', 'hidden-gems', 'food-drink'],
    district: 'Hongkou',
    lat: 31.2603, lng: 121.4933,
    description: "A stunning Art Deco former abattoir (1933) converted into a creative space of galleries, restaurants, and concept stores. The geometric concrete interior — bridges, spiral ramps, cattle walkways — is architecturally breathtaking.",
    visit_duration_min: 75,
    cost_level: 0,
    image_url: '',
  },
  // ── Songjiang (Day trip) ──────────────────────────────────────────────────
  {
    id: 'manual-zhujiajiao',
    name: { en: 'Zhujiajiao Water Town', zh: '朱家角古镇' },
    category: 'neighborhood',
    tags: ['culture-history', 'hidden-gems', 'nature-parks'],
    district: 'Qingpu',
    lat: 31.1128, lng: 121.0653,
    description: "A 1,700-year-old water town 50km from central Shanghai, with arched stone bridges, canal-side Ming and Qing dynasty houses, and gondola rides. The best-preserved ancient water town near Shanghai.",
    visit_duration_min: 180,
    cost_level: 1,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Zhujiajiao_Water_Town.jpg/1280px-Zhujiajiao_Water_Town.jpg',
  },
  // ── Yangpu ────────────────────────────────────────────────────────────────
  {
    id: 'manual-1862-art-center',
    name: { en: '1862 Art Center', zh: '1862时尚艺术中心' },
    category: 'gallery',
    tags: ['art-museums', 'nightlife', 'food-drink'],
    district: 'Huangpu',
    lat: 31.2280, lng: 121.5050,
    description: "A renovated 1862 dockyard on the South Bund waterfront, now a premier venue for contemporary art exhibitions, live performances, and upscale dining. Sweeping Huangpu River views.",
    visit_duration_min: 90,
    cost_level: 2,
    image_url: '',
  },
  // ── Parks ─────────────────────────────────────────────────────────────────
  {
    id: 'manual-century-park',
    name: { en: 'Century Park', zh: '世纪公园' },
    category: 'park',
    tags: ['nature-parks', 'family-friendly'],
    district: 'Pudong',
    lat: 31.2148, lng: 121.5447,
    description: "Shanghai's largest park (140 hectares) with a central lake, meadows, cycling paths, and boat rentals. Popular with families at weekends, especially during spring cherry blossom and autumn foliage seasons.",
    visit_duration_min: 120,
    cost_level: 0,
    image_url: '',
  },
  {
    id: 'manual-fuxing-park',
    name: { en: 'Fuxing Park', zh: '复兴公园' },
    category: 'park',
    tags: ['nature-parks', 'hidden-gems', 'family-friendly'],
    district: 'Xuhui',
    lat: 31.2166, lng: 121.4690,
    description: "A graceful French-style garden (1909) in the heart of the former French Concession, popular with locals doing morning tai chi, ballroom dancing, and mahjong under the plane trees.",
    visit_duration_min: 60,
    cost_level: 0,
    image_url: '',
  },
  // ── Food & nightlife ──────────────────────────────────────────────────────
  {
    id: 'manual-yuyuan-bazaar',
    name: { en: 'Yuyuan Bazaar', zh: '豫园商城' },
    category: 'market',
    tags: ['food-drink', 'shopping', 'culture-history'],
    district: 'Huangpu',
    lat: 31.2267, lng: 121.4920,
    description: "The old-city market surrounding Yu Garden, crammed with soup dumplings, glutinous rice cakes, and traditional snacks. Hunt for xiaolongbao at Nanxiang Steamed Bun Restaurant and sesame candy in the side lanes.",
    visit_duration_min: 75,
    cost_level: 1,
    image_url: '',
  },
  {
    id: 'manual-wukang-road',
    name: { en: 'Wukang Road', zh: '武康路' },
    category: 'neighborhood',
    tags: ['hidden-gems', 'culture-history', 'food-drink'],
    district: 'Xuhui',
    lat: 31.2100, lng: 121.4473,
    description: "A 1.17km tree-lined boulevard of French Concession heritage villas, boutique cafés, and independent bookstores. The Normandie Apartments (1924) at the north end is Shanghai's most photographed building.",
    visit_duration_min: 60,
    cost_level: 0,
    image_url: '',
  },
  {
    id: 'manual-nanjing-road',
    name: { en: 'Nanjing Road Pedestrian Street', zh: '南京路步行街' },
    category: 'shopping',
    tags: ['shopping', 'food-drink'],
    district: 'Huangpu',
    lat: 31.2354, lng: 121.4760,
    description: "One of the world's busiest shopping streets, stretching 1.2km from People's Square to the Bund. A mix of flagship international brands, century-old department stores, and street food vendors.",
    visit_duration_min: 90,
    cost_level: 1,
    image_url: '',
  },
  {
    id: 'manual-lost-heaven-bar',
    name: { en: 'The Long Bar at Waldorf Astoria', zh: '华尔道夫酒店长廊酒吧' },
    category: 'bar',
    tags: ['nightlife', 'hidden-gems'],
    district: 'Huangpu',
    lat: 31.2389, lng: 121.4897,
    description: "The restored 1911 bar inside the former Shanghai Club — the longest bar in Asia at 33.5m. Sipping a cocktail here under the original coffered ceiling while overlooking the Bund is a quintessential Shanghai experience.",
    visit_duration_min: 90,
    cost_level: 3,
    image_url: '',
  },
  {
    id: 'manual-cat-paw-jazz',
    name: { en: 'JZ Club', zh: 'JZ俱乐部' },
    category: 'bar',
    tags: ['nightlife', 'art-museums'],
    district: 'Jing\'an',
    lat: 31.2209, lng: 121.4565,
    description: "Shanghai's premier jazz club, running live performances every night since 2004. The intimate basement venue draws top local and international jazz musicians. Arrive early for a good table.",
    visit_duration_min: 120,
    cost_level: 2,
    image_url: '',
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const places = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const existingIds = new Set(places.map(p => p.id))

  let added = 0
  let skipped = 0

  for (const place of MANUAL_PLACES) {
    if (existingIds.has(place.id)) {
      console.log(`  skip (exists): ${place.name.en}`)
      skipped++
    } else {
      places.push(place)
      console.log(`  added: ${place.name.en}`)
      added++
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(places, null, 2))

  console.log(`\n✓ Added ${added} places, skipped ${skipped} duplicates`)
  console.log(`  Total places now: ${places.length}`)
}

main()
