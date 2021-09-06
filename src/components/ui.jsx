/* Simple reusable UI primitives styled with Tailwind. */
import { useState } from 'react'

export function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={`w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${isPassword ? 'pr-11' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            {show ? 'Masquer' : 'Voir'}
          </button>
        )}
      </div>
    </label>
  )
}

export function Button({ children, type = 'button', disabled, variant = 'primary', loading = false, ...rest }) {
  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    ghost: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
  }
  return (
    <button type={type} disabled={disabled || loading} className={`${base} ${variants[variant]}`} {...rest}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  const styles = {
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  }
  return (
    <div role="alert" className={`rounded-lg border px-4 py-2.5 text-sm ${styles[kind] || styles.error}`}>
      {children}
    </div>
  )
}
