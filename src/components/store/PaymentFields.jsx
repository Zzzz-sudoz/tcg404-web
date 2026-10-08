import { cardBrand } from '../../utils/checkout'

export default function PaymentFields({
  value,
  onChange,
  errors,
  disabled,
  onFieldChange,
}) {
  const update = (key, next) => {
    onChange((current) => ({ ...current, [key]: next }))
    onFieldChange(key)
  }
  const brand = cardBrand(value.number)
  return (
    <fieldset className="checkout-payment" disabled={disabled}>
      <legend>Payment method</legend>
      <div className="payment-options">
        {['card', 'gcash'].map((method) => (
          <label
            className={`payment-option ${value.method === method ? 'is-selected' : ''}`}
            key={method}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={value.method === method}
              onChange={() => update('method', method)}
            />
            <span>{method === 'card' ? 'Credit / debit card' : 'GCash'}</span>
            <span className="payment-logo">
              <img
                src={
                  method === 'card'
                    ? '/payments/visa.png'
                    : '/payments/gcash.avif'
                }
                alt={method === 'card' ? 'Visa' : 'GCash'}
              />
            </span>
          </label>
        ))}
      </div>
      {value.method === 'card' ? (
        <>
          <div className="payment-card-preview" aria-hidden="true">
            <div className="row-between">
              <span>TCG404 / COLLECTOR</span>
              <span>
                {brand === 'mastercard'
                  ? 'Mastercard'
                  : brand === 'visa'
                    ? 'Visa'
                    : 'DEBIT / CREDIT'}
              </span>
            </div>
            <span className="payment-chip" />
            <strong className="payment-card-number">
              •••• •••• ••••{' '}
              {value.number.replace(/\D/g, '').slice(-4) || '••••'}
            </strong>
            <div className="row-between">
              <span>{value.holder || 'CARDHOLDER NAME'}</span>
              <span>{value.expiry || 'MM/YY'}</span>
            </div>
          </div>
          <div className="payment-fields">
            {[
              ['number', 'Card number', '1234 5678 9012 3456', 23, 'numeric'],
              ['holder', 'Name on card', 'Full name', 100, 'text'],
              ['expiry', 'Expiry', 'MM/YY', 5, 'numeric'],
              ['cvc', 'Security code', 'CVC', 4, 'numeric'],
            ].map(([key, label, placeholder, maxLength, inputMode]) => (
              <label
                key={key}
                className={
                  ['number', 'holder'].includes(key) ? 'payment-wide' : ''
                }
                htmlFor={`payment-${key}`}
              >
                {label}
                <input
                  id={`payment-${key}`}
                  name={`payment-${key}`}
                  type={key === 'cvc' ? 'password' : 'text'}
                  inputMode={inputMode}
                  autoComplete="off"
                  value={value[key]}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  required
                  onChange={(event) => {
                    let next = event.target.value
                    if (key === 'number')
                      next = next
                        .replace(/\D/g, '')
                        .slice(0, 19)
                        .replace(/(.{4})/g, '$1 ')
                        .trim()
                    if (key === 'expiry')
                      next = next
                        .replace(/\D/g, '')
                        .slice(0, 4)
                        .replace(/^(\d{2})(\d)/, '$1/$2')
                    if (key === 'cvc')
                      next = next.replace(/\D/g, '').slice(0, 4)
                    update(key, next)
                  }}
                  aria-invalid={!!errors[key]}
                  aria-describedby={
                    errors[key] ? `payment-error-${key}` : undefined
                  }
                />
                {errors[key] && (
                  <span className="field-error" id={`payment-error-${key}`}>
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </>
      ) : (
        <div className="gcash-entry">
          <span className="gcash-emblem">
            <img src="/payments/gcash.avif" alt="GCash" />
          </span>
          <h3>Your wallet. Your next find.</h3>
          <label htmlFor="payment-mobile">
            GCash mobile number
            <input
              id="payment-mobile"
              name="payment-mobile"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              maxLength={16}
              placeholder="09XX XXX XXXX"
              required
              value={value.mobile}
              onChange={(event) => update('mobile', event.target.value)}
              aria-invalid={!!errors.mobile}
              aria-describedby={
                errors.mobile ? 'payment-error-mobile' : undefined
              }
            />
            {errors.mobile && (
              <span className="field-error" id="payment-error-mobile">
                {errors.mobile}
              </span>
            )}
          </label>
        </div>
      )}
    </fieldset>
  )
}
