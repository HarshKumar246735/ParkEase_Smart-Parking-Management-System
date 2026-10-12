import { useId } from 'react';

/** Accessible labelled field with inline error. `as` = 'input' | 'select' | 'textarea'. */
export default function FormField({ label, error, hint, as = 'input', children, className = '', ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, ...props };
  let control;
  if (as === 'select') control = <select className="select" {...common}>{children}</select>;
  else if (as === 'textarea') control = <textarea className="textarea input" rows={3} {...common} />;
  else control = <input className="input" {...common} />;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {error ? <span className="field-error" id={`${id}-err`} role="alert">{error}</span> : hint ? <span className="field-hint" id={`${id}-hint`}>{hint}</span> : null}
    </div>
  );
}
