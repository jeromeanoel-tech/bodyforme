export default function Loading() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 h-12 border-b border-neutral-200 bg-white px-6 flex items-center gap-3">
        <div className="h-5 w-28 bg-neutral-100 rounded animate-pulse" />
        <div className="ml-auto h-5 w-20 bg-neutral-100 rounded animate-pulse" />
      </div>
      <div className="flex-1 p-6 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-11 bg-neutral-100 rounded-lg animate-pulse"
            style={{ opacity: Math.max(0.15, 1 - i * 0.08) }}
          />
        ))}
      </div>
    </div>
  )
}
