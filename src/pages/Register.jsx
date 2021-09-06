import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { Alert, Button, TextField } from '../components/ui.jsx'

export default function Register({ onSwitch }) {
  const { register, login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ username: form.username.trim(), email: form.email.trim(), password: form.password })
      // Auto-login right after successful registration.
      await login(form.username.trim(), form.password)
    } catch (err) {
      setError(err.message || "Échec de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Créer un compte" subtitle="Configurez l'accès à votre cybercafé en quelques secondes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert kind="error">{error}</Alert>

        <TextField
          id="username"
          label="Nom d'utilisateur"
          value={form.username}
          onChange={update('username')}
          placeholder="alice"
          autoComplete="username"
          minLength={3}
          required
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="alice@example.com"
          autoComplete="email"
          required
        />
        <TextField
          id="password"
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <Button type="submit" loading={loading} disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Déjà inscrit ?{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-brand-400 hover:text-brand-300">
          Se connecter
        </button>
      </p>
    </AuthLayout>
  )
}
