interface Props {
  current: number  // 1-indexed
  total:   number
}

export function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>Step {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
