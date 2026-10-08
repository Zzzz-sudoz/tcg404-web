export default function Section({
  id,
  title,
  note,
  action,
  children,
  className = '',
}) {
  return (
    <section
      id={id}
      className={`page-section ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="section-heading">
        <div>
          <h2 id={`${id}-heading`}>{title}</h2>
          {note && <p>{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
