import { NextRequest, NextResponse } from 'next/server'
import { CuratedPlace, DAY_CONFIG } from '@/lib/curated-data'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

type Day = typeof DAY_CONFIG[number] & { places: CuratedPlace[] }

// ─── Notion block helpers ──────────────────────────────────────────────────────

function heading2(text: string) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: text } }] },
  }
}

function heading3(text: string) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content: text } }] },
  }
}

function paragraph(text: string) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
  }
}

function callout(text: string, emoji: string) {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji },
    },
  }
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} }
}

function buildPlaceBlocks(place: CuratedPlace): object[] {
  const blocks: object[] = []

  const icon = {
    landmark:'📍', museum:'🏛️', historic:'🏯', shopping:'🛍️',
    restaurant:'🍜', cafe:'☕', bakery:'🥐', art:'🎨',
    market:'🏪', park:'🌿', attraction:'🎡',
  }[place.category] ?? '📍'

  blocks.push(heading3(`${icon} ${place.name.en} (${place.name.zh})`))

  const meta = [
    place.category,
    place.district,
    place.tags.join(' · '),
  ].filter(Boolean).join(' | ')
  if (meta) blocks.push(paragraph(meta))

  if (place.address) blocks.push(paragraph(`📌 ${place.address}`))
  if (place.description) blocks.push(paragraph(place.description))
  if (place.notes) blocks.push(callout(place.notes, '💡'))

  return blocks
}

function buildDayBlocks(day: Day): object[] {
  const blocks: object[] = []
  blocks.push(heading2(`${day.emoji} Day ${day.dayNumber} — ${day.title}`))
  blocks.push(paragraph(day.subtitle))

  for (const place of day.places) {
    blocks.push(...buildPlaceBlocks(place))
    blocks.push(divider())
  }

  return blocks
}

// ─── Notion API helpers ────────────────────────────────────────────────────────

async function notionFetch(path: string, token: string, body: object) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || `Notion API error ${res.status}`)
  }
  return data
}

async function appendBlocks(pageId: string, token: string, blocks: object[]) {
  const BATCH = 90 // Notion limit is 100 per request
  for (let i = 0; i < blocks.length; i += BATCH) {
    await notionFetch(`/blocks/${pageId}/children`, token, {
      children: blocks.slice(i, i + BATCH),
    })
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { token, parentPageId, days } = await req.json() as {
      token: string
      parentPageId: string
      days: Day[]
    }

    if (!token || !parentPageId || !days) {
      return NextResponse.json({ error: 'Missing token, parentPageId, or days' }, { status: 400 })
    }

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    // 1. Create the parent page
    const page = await notionFetch('/pages', token, {
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: `🗺️ My Shanghai Guide — ${dateStr}` } }],
        },
      },
    })

    const newPageId: string = page.id

    // 2. Build all blocks
    const intro: object[] = [
      paragraph(`92 curated places across 8 neighborhoods. Created by Shanghai Itinerary Builder on ${dateStr}.`),
      divider(),
    ]

    const dayBlocks = days.flatMap(day => buildDayBlocks(day))
    const allBlocks = [...intro, ...dayBlocks]

    // 3. Append in batches
    await appendBlocks(newPageId, token, allBlocks)

    const cleanId = newPageId.replace(/-/g, '')
    const notionUrl = `https://notion.so/${cleanId}`

    return NextResponse.json({ url: notionUrl })
  } catch (err: any) {
    console.error('Notion API error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create Notion page' }, { status: 500 })
  }
}
