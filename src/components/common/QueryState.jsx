import LoadingLayout from './LoadingLayout'
export default function QueryState({
  response,
  retry,
  empty = 'No records found.',
}) {
  if (response.loading) return <LoadingLayout variant="records" count={3} />
  if (!response.loading && !response.error && response.data?.length !== 0)
    return null
  return (
    <div className="empty-panel" role={response.error ? 'alert' : 'status'}>
      <p>
        {response.loading
          ? 'Loading saved records...'
          : response.error || empty}
      </p>
      {response.error && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}
