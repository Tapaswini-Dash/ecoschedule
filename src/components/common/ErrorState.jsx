export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="rounded-xl border border-bad/40 bg-bad/10 p-6 text-center" role="alert">
      <p className="text-sm font-semibold text-bad">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm text-text hover:bg-panel-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}