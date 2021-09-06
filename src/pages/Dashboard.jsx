import { useAuth } from '../context/useAuth.js'
import { Button } from '../components/ui.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-ink-900 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="DenkoCyber" width="40" height="40" />
            <span className="text-lg font-bold tracking-tight text-white">DenkoCyber</span>
          </div>
          <div className="w-40">
            <Button variant="ghost" onClick={logout}>
              Se déconnecter
            </Button>
          </div>
        </header>

        <main className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8">
          <span className="mb-4 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
          <h1 className="text-2xl font-bold text-white">Hello World</h1>
          <p className="mt-2 text-slate-300">
            Connecté en tant que <span className="text-gradient font-semibold">{user?.username}</span> ({user?.email}).
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ['ID', user?.id],
              ['Nom d’utilisateur', user?.username],
              ['Email', user?.email],
              ['Actif', user?.is_active ? 'Oui' : 'Non'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm text-slate-100">{String(value ?? '—')}</dd>
              </div>
            ))}
          </dl>
        </main>
      </div>
    </div>
  )
}
