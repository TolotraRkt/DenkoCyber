/* Historique des sessions : liste filtrable, paginée, avec totaux. */
import { useCallback, useEffect, useState } from 'react'
import { FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Alert } from '../components/ui.jsx'
import { sessionsApi } from '../services/api.js'

const PAGE_SIZE = 20

/* Libellés et couleurs par statut de session. */
const STATUS_META = {
  pending: { label: 'En attente', badge: 'bg-sky-500/10 text-sky-300' },
  running: { label: 'En cours', badge: 'bg-amber-500/10 text-amber-300' },
  done: { label: 'Terminée', badge: 'bg-emerald-500/10 text-emerald-300' },
  expired: { label: 'Expirée', badge: 'bg-slate-500/10 text-slate-300' },
}

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'running', label: 'En cours' },
  { value: 'done', label: 'Terminées' },
  { value: 'expired', label: 'Expirées' },
]

/* Formate une date ISO en date+heure locale courte. */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], total: 0, total_amount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await sessionsApi.history({
        status: status || undefined,
        date: date || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setData(res)
    } catch (err) {
      setError(err.message || "Impossible de charger l'historique.")
    } finally {
      setLoading(false)
    }
  }, [status, date, page])

  useEffect(() => {
    load()
  }, [load])

  // Retour à la première page dès qu'un filtre change.
  useEffect(() => {
    setPage(0)
  }, [status, date])

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <div className="h-full flex-1 overflow-y-auto px-6 py-8 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Historique</h1>
        <p className="mt-1 text-slate-400">Toutes les sessions passées du cybercafé.</p>
      </header>

      {/* Barre de filtres */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-slate-400">
          <FiFilter /> Filtres :
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
        />
        {(status || date) && (
          <button
            type="button"
            onClick={() => {
              setStatus('')
              setDate('')
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* Totaux du filtre courant */}
      <div className="mb-4 flex flex-wrap gap-6 text-sm text-slate-400">
        <span>
          <span className="font-semibold text-slate-100">{data.total}</span> session(s)
        </span>
        <span>
          Total :{' '}
          <span className="font-semibold text-emerald-400">
            {data.total_amount.toLocaleString('fr-FR')} Ar
          </span>
        </span>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créée le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Chargement…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aucune session pour ce filtre.
                </td>
              </tr>
            ) : (
              data.items.map((s) => {
                const meta = STATUS_META[s.status] || STATUS_META.expired
                return (
                  <tr key={s.id} className="bg-slate-900/40 hover:bg-slate-900">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-100">{s.code}</td>
                    <td className="px-4 py-3 text-slate-300">{s.station_id}</td>
                    <td className="px-4 py-3 text-slate-300">{Math.round(s.minutes)} min</td>
                    <td className="px-4 py-3 text-slate-300">
                      {Number(s.amount).toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(s.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Page {page + 1} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
          >
            <FiChevronLeft /> Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
          >
            Suivant <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}
