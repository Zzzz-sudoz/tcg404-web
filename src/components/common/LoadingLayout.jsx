export default function LoadingLayout({ variant = 'cards', count = 6 }) {
  return (
    <div
      className={`loading-layout loading-${variant}`}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }, (_, index) => (
        <div className="loading-surface" key={index} aria-hidden="true">
          <div className="loading-art" />
          <div className="loading-line" />
          <div className="loading-line loading-short" />
        </div>
      ))}
    </div>
  )
}

