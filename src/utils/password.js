export function passwordChecks(value = '') {
  return [
    {
      label: '5–128 characters',
      valid: value.length >= 5 && value.length <= 128,
    },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(value) },
    { label: 'One number', valid: /[0-9]/.test(value) },
    { label: 'One special character', valid: /[^A-Za-z0-9\s]/.test(value) },
  ]
}

export function validateRegistration(values) {
  const errors = {}
  if (!values.name.trim() || values.name.trim().length > 100)
    errors.name = 'Enter your name.'
  if (
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  )
    errors.email = 'Enter a valid email.'
  if (passwordChecks(values.password).some((check) => !check.valid))
    errors.password = 'Complete the password requirements.'
  if (values.password !== values.confirmPassword || !values.confirmPassword)
    errors.confirmPassword = 'Passwords must match.'
  return errors
}
