export default function Loading() {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        {/* Sleek Takumi Tech style spinner */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-black"></div>
          <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading The Room...</p>
        </div>
      </div>
    )
  }