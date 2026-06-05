'use client'

import { useEffect, useState } from 'react'
import { CuratedPlace, DAY_CONFIG } from '@/lib/curated-data'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  days: (typeof DAY_CONFIG[number] & { places: CuratedPlace[] })[]
  onClose: () => void
}

export function NotionExportModal({ days, onClose }: Props) {
  const [token,    setToken]    = useState('')
  const [pageId,   setPageId]   = useState('')
  const [status,   setStatus]   = useState<Status>('idle')
  const [notionUrl, setNotionUrl] = useState('')
  const [errorMsg, setErrorMsg]  = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleExport() {
    if (!token.trim() || !pageId.trim()) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), parentPageId: pageId.trim(), days }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setNotionUrl(data.url)
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl px-5 pt-5 pb-10
                      flex flex-col gap-5 w-full sm:max-w-md sm:mx-4 max-h-[90vh] overflow-y-auto">

        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Save to Notion</h2>
            <p className="text-sm text-gray-400 mt-0.5">Creates a full page with all 8 days in your workspace</p>
          </div>
          <button onClick={onClose} className="text-gray-300 text-xl leading-none ml-4">✕</button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col gap-4 items-center text-center py-4">
            <div className="text-5xl">✅</div>
            <p className="font-semibold text-gray-900">Itinerary saved to Notion!</p>
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-black text-white font-semibold rounded-2xl text-center"
            >
              Open in Notion →
            </a>
            <button onClick={onClose} className="text-sm text-gray-400 underline">Close</button>
          </div>
        ) : (
          <>
            {/* Instructions */}
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Setup (one-time, 2 minutes)</p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>
                  Go to{' '}
                  <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">notion.so/my-integrations</a>
                  {' '}→ New integration → copy the token
                </li>
                <li>Open the Notion page where you want the itinerary saved</li>
                <li>Click ··· → Connections → add your integration</li>
                <li>Copy the page ID from the URL (32 characters after the last /)</li>
              </ol>
            </div>

            {/* Token input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Integration Token
              </label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-black transition-colors font-mono"
              />
              <p className="text-xs text-gray-400">Sent directly to Notion — never stored by this app</p>
            </div>

            {/* Page ID input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Parent Page ID
              </label>
              <input
                type="text"
                value={pageId}
                onChange={e => setPageId(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-black transition-colors font-mono"
              />
              <p className="text-xs text-gray-400">From the URL: notion.so/Your-Page-<strong>xxxxxx</strong></p>
            </div>

            {/* Error */}
            {status === 'error' && errorMsg && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {errorMsg}
              </p>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={!token.trim() || !pageId.trim() || status === 'loading'}
              className="w-full py-4 bg-black text-white font-semibold rounded-2xl
                         disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {status === 'loading' ? 'Creating Notion page…' : 'Export to Notion'}
            </button>

            <p className="text-xs text-center text-gray-300">
              92 places across 8 days · ~30 seconds to create
            </p>
          </>
        )}
      </div>
    </div>
  )
}
