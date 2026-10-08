import { passwordChecks } from '../../utils/password'

export default function PasswordChecks({ value }) {
  return (
    <ul className="password-checks" aria-label="Password requirements">
      {passwordChecks(value).map((check) => (
        <li key={check.label} className={check.valid ? 'is-valid' : ''}>
          <span aria-hidden="true">{check.valid ? '✓' : '○'}</span>
          <span>{check.label}</span>
          <span className="sr-only">{check.valid ? 'met' : 'not met'}</span>
        </li>
      ))}
    </ul>
  )
}
