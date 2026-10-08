export default function Pagination({ page, pages, onChange }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
