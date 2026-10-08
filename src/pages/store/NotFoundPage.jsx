import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="page-width not-found">
      <span className="error-number">404</span>
      <h1>
        Card not found.
        <br />
        Neither is this page.
      </h1>
      <p>
        That address isn’t in our collection. Head back to the homepage and find
        a new starting point.
      </p>
      <Link className="button button-primary" to="/">
        Back to TCG404
      </Link>
    </section>
  )
}
