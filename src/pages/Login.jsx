import { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { Alert, Button, TextField } from '../components/ui.jsx'

export default function Login() {
  const history = useHistory()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      history.replace('/dashboard')
    } catch (err) {
      setError(err.message || 'Échec de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à la supervision de votre cybercafé.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert kind="error">{error}</Alert>

        <TextField
          id="identifier"
          label="Nom d'utilisateur ou email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Nom d'utilisateur ou email"
          autoComplete="username"
          required
        />
        <TextField
          id="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <Button type="submit" loading={loading} disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-blue-400 transition hover:text-blue-300">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  )
}
