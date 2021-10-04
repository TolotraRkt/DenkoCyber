/* Tableau de bord opérateur : chiffres clés + sessions en cours. */
import { useCallback, useEffect, useState } from 'react'
import { FiMonitor, FiActivity, FiDollarSign, FiClock, FiUsers } from 'react-icons/fi'
import { Alert } from '../components/ui.jsx'
import { sessionsApi, stationsApi } from '../services/api.js'

/* Intervalle de rafraîchissement (ms). */
const POLL_INTERVAL = 5000

/* Formate un nombre de secondes en HH:MM:SS (ou MM:SS). */
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/* Petit encart de statistique. */
function StatCard({ icon: Icon, label, value, accent = 'text-blue-400' }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon size={20} className={accent} />
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [running, setRunning] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [s, live] = await Promise.all([sessionsApi.stats(), stationsApi.liveAll()])
      setStats(s)
      // Sessions en cours = postes occupés avec une session active.
      setRunning(live.stations.filter((item) => item.session).map((item) => ({
        station: item.station,
        session: item.session,
        remaining: item.remaining_seconds,
      })))
    } catch (err) {
      setError(err.message || 'Impossible de charger le tableau de bord.')
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, POLL_INTERVAL)
    return () => window.clearInterval(id)
  }, [refresh])

  // Décompte local seconde par seconde pour les chronos.
  useEffect(() => {
    const id = window.setInterval(() => {
      setRunning((prev) =>
        prev.map((item) =>
          item.remaining != null && item.remaining > 0
            ? { ...item, remaining: item.remaining - 1 }
            : item,
        ),
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="h-full flex-1 overflow-y-auto px-6 py-8 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Tableau de bord</h1>
        <p className="mt-1 text-slate-400">Vue d'ensemble du cybercafé en temps réel.</p>
      </header>

      {error && (
        <div className="mb-6">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* Chiffres clés */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FiMonitor}
          label="Postes occupés"
          value={stats ? `${stats.stations_busy} / ${stats.stations_total}` : '—'}
          accent="text-amber-400"
        />
        <StatCard
          icon={FiActivity}
          label="Sessions en cours"
          value={stats ? stats.sessions_running : '—'}
          accent="text-emerald-400"
        />
        <StatCard
          icon={FiUsers}
          label="Sessions aujourd'hui"
          value={stats ? stats.sessions_today : '—'}
        />
        <StatCard
          icon={FiDollarSign}
          label="Revenus du jour (Ar)"
          value={stats ? stats.revenue_today.toLocaleString('fr-FR') : '—'}
          accent="text-emerald-400"
        />
      </div>

      {/* Sessions en cours */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <FiClock className="text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-100">Sessions en cours</h2>
        </div>

        {running.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center text-slate-500">
            Aucune session en cours.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {running.map((item) => (
              <div
                key={item.station.code}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    {item.station.code}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    {item.session.code}
                  </span>
                </div>
                <p className="mt-4 font-mono text-3xl font-extrabold tabular-nums text-slate-100">
                  {item.remaining == null ? '--:--' : formatDuration(item.remaining)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">restant</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
