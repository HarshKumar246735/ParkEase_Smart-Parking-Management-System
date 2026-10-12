import { Smartphone, CreditCard, Landmark, Wallet } from 'lucide-react';
import FormField from '../common/FormField.jsx';
import { formatCardNumber, formatExpiry, DEMO_VALUES } from '../../utils/paymentValidation.js';
import { METHOD_LABELS } from '../../utils/format.js';

const ICONS = { UPI: Smartphone, CARD: CreditCard, NETBANKING: Landmark, WALLET: Wallet };

export default function PaymentMethodSelector({ options, method, provider, form, errors, disabled, onMethod, onProvider, onForm }) {
  const set = (k) => (e) => onForm({ ...form, [k]: e.target.value });
  return (
    <div className="pm">
      <div className="pm-tabs" role="tablist" aria-label="Payment method">
        {Object.keys(options).map((m) => {
          const Icon = ICONS[m];
          return (
            <button key={m} role="tab" type="button" aria-selected={method === m} disabled={disabled} className={`pm-tab ${method === m ? 'active' : ''}`} onClick={() => onMethod(m)}>
              <Icon size={20} aria-hidden="true" /> <span>{METHOD_LABELS[m]}</span>
            </button>
          );
        })}
      </div>

      <div className="pm-panel" role="tabpanel">
        {method === 'UPI' && (
          <>
            <div className="pm-choices" role="radiogroup" aria-label="UPI app">
              {options.UPI.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={provider === p} disabled={disabled} className={`pm-choice ${provider === p ? 'active' : ''}`} onClick={() => onProvider(p)}>{p}</button>
              ))}
            </div>
            {errors.provider && <span className="field-error" role="alert">{errors.provider}</span>}
            {provider === 'UPI ID' && (
              <FormField label="UPI ID (demo)" placeholder="demo@demobank" value={form.upiId} onChange={set('upiId')} error={errors.upiId} disabled={disabled} autoComplete="off" hint="Use a fictional ID. It is not sent anywhere." />
            )}
          </>
        )}

        {method === 'CARD' && (
          <div className="form-grid">
            <div className="span-2 pm-choices" role="radiogroup" aria-label="Card type">
              {options.CARD.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={provider === p} disabled={disabled} className={`pm-choice ${provider === p ? 'active' : ''}`} onClick={() => onProvider(p)}>{p}</button>
              ))}
            </div>
            <FormField className="span-2" label="Cardholder name" placeholder="Demo Visitor" value={form.cardName} onChange={set('cardName')} error={errors.cardName} disabled={disabled} autoComplete="off" />
            <FormField className="span-2" label="Card number" inputMode="numeric" placeholder="4111 1111 1111 1111" value={form.cardNumber} onChange={(e) => onForm({ ...form, cardNumber: formatCardNumber(e.target.value) })} error={errors.cardNumber} disabled={disabled} autoComplete="off" />
            <FormField label="Expiry (MM/YY)" inputMode="numeric" placeholder="12/34" value={form.expiry} onChange={(e) => onForm({ ...form, expiry: formatExpiry(e.target.value) })} error={errors.expiry} disabled={disabled} autoComplete="off" />
            <FormField label="CVV" inputMode="numeric" type="password" maxLength={3} placeholder="123" value={form.cvv} onChange={(e) => onForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} error={errors.cvv} disabled={disabled} autoComplete="off" />
          </div>
        )}

        {method === 'NETBANKING' && (
          <FormField as="select" label="Choose a demo bank" value={provider} onChange={(e) => onProvider(e.target.value)} error={errors.provider} disabled={disabled}>
            <option value="">Select bank</option>
            {options.NETBANKING.map((b) => <option key={b} value={b}>{b}</option>)}
          </FormField>
        )}

        {method === 'WALLET' && (
          <>
            <div className="pm-choices" role="radiogroup" aria-label="Wallet">
              {options.WALLET.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={provider === p} disabled={disabled} className={`pm-choice ${provider === p ? 'active' : ''}`} onClick={() => onProvider(p)}>{p}</button>
              ))}
            </div>
            {errors.provider && <span className="field-error" role="alert">{errors.provider}</span>}
          </>
        )}

        {(method === 'CARD' || (method === 'UPI' && provider === 'UPI ID')) && (
          <button type="button" className="btn btn-ghost btn-sm pm-demofill" disabled={disabled} onClick={() => onForm({ ...form, ...DEMO_VALUES })}>Fill with demo values</button>
        )}
      </div>
    </div>
  );
}
