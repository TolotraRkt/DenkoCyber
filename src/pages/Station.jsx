/* Écran du poste client : le client saisit le code reçu à l'accueil,
   la session démarre, puis un chrono HH:MM décroissant s'affiche jusqu'à
   la fin du temps. L'état est resynchronisé régulièrement avec le backend. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiMonitor, FiLogIn, FiClock, FiCheckCircle } from 'react-icons/fi'
import { Alert, Button, TextField } from '../components/ui.jsx'
import { sessionsApi, stationsApi } from '../services/api.js'

/* Intervalle de resynchronisation avec le backend (ms). */
const POLL_INTERVAL = 5000

/* Formate un nombre de secondes en HH:MM:SS (au moins MM:SS). */
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/* Récupère le code poste depuis l'URL (?station=PC-02) ou le localStorage. */
function resolveStationCode() {
  const fromUrl = new URLSearchParams(window.location.search).get('station')
  const fromStorage = localStorage.getItem('denkocyber_station')
  return (fromUrl || fromStorage || '').toUpperCase()
}

export default function Station() {
  const [stationCode, setStationCode] = useState(resolveStationCode)
  const [codeInput, setCodeInput] = useState('')
  const [session, setSession] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Vrai une fois que la session vient de se terminer (message de fin).
  const [finished, setFinished] = useState(false)
  // Empêche les appels concurrents au backend pendant le poll.
  const pollingRef = useRef(false)

  /* Miroir de l'état `session` lisible dans les callbacks sans les recréer. */
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  /* Enregistre le code poste pour les prochaines visites. */
  useEffect(() => {
    if (stationCode) localStorage.setItem('denkocyber_station', stationCode)
  }, [stationCode])

  /* Synchronise l'état courant du poste avec le backend. */
  const sync = useCallback(async () => {
    if (!stationCode || pollingRef.current) return
    pollingRef.current = true
    try {
      const live = await stationsApi.live(stationCode)
      if (live.session) {
        setSession(live.session)
        setRemaining(live.remaining_seconds ?? 0)
        setFinished(false)
      } else if (sessionRef.current) {
        // La session existait et n'est plus active -> elle est terminée.
        setSession(null)
        setRemaining(null)
        setFinished(true)
      }
    } catch (err) {
      // Erreur réseau transitoire : on ne casse pas l'écran, on réessaiera.
      setError(err.message || 'Synchronisation impossible.')
    } finally {
      pollingRef.current = false
    }
  }, [stationCode])

  /* Récupère l'état initial au montage, puis resynchronise périodiquement.
     On poll en permanence (même sans session) pour détecter une session
     démarrée ailleurs (ex. par l'opérateur) et l'afficher automatiquement. */
  useEffect(() => {
    if (!stationCode) return undefined
    sync()
    const id = window.setInterval(sync, POLL_INTERVAL)
    return () => window.clearInterval(id)
  }, [stationCode, sync])

  /* Décompte local, seconde par seconde, pour un affichage fluide. */
  useEffect(() => {
    if (!session || remaining === null) return undefined
    if (remaining <= 0) {
      sync()
      return undefined
    }
    const id = window.setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [session, remaining, sync])

  /* Déclenche la fin quand le temps atteint zéro. */
  useEffect(() => {
    if (session && remaining === 0) {
      setSession(null)
      setRemaining(null)
      setFinished(true)
    }
  }, [session, remaining])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFinished(false)
    if (!stationCode) {
      setError("Le code du poste n'est pas défini. Ajoutez ?station=PC-XX à l'URL.")
      return
    }
    const code = codeInput.trim().toUpperCase()
    if (code.length !== 4) {
      setError('Le code doit contenir exactement 4 caractères.')
      return
    }
    setSubmitting(true)
    try {
      const started = await sessionsApi.claim(code, stationCode)
      setSession(started)
      setRemaining(Math.round(started.minutes * 60))
      setCodeInput('')
    } catch (err) {
      setError(err.message || 'Impossible de démarrer la session.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSeconds = session ? Math.round(session.minutes * 60) : 0
  const progress = totalSeconds > 0 && remaining !== null ? (remaining / totalSeconds) * 100 : 0

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-lg">
        {/* En-tête : poste courant */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <FiMonitor size={28} className="text-blue-400" />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Poste</p>
            <p className="text-xl font-bold text-slate-100">{stationCode || 'Non défini'}</p>
          </div>
        </div>

        {session ? (
          /* Écran de session en cours : le chrono est roi. */
          <div className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-12 text-center">
            <p className="text-sm uppercase tracking-widest text-slate-500">Temps restant</p>
            <p className="mt-4 font-mono text-7xl font-extrabold tracking-tight text-slate-100 tabular-nums sm:text-8xl">
              {remaining === null ? '--:--' : formatDuration(remaining)}
            </p>

            {/* Barre de progression du temps écoulé */}
            <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
              <FiClock size={18} />
              <span>
                Code <span className="font-semibold text-slate-200">{session.code}</span> —{' '}
                {session.station_id}
              </span>
            </div>
          </div>
        ) : (
          /* Écran de saisie du code. */
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-10"
          >
            {finished && (
              <div className="mb-6">
                <Alert kind="success">
                  <span className="inline-flex items-center gap-2">
                    <FiCheckCircle /> Session terminée. Merci !
                  </span>
                </Alert>
              </div>
            )}

            <h1 className="text-center text-3xl font-bold tracking-tight text-slate-100">
              Entrez votre code
            </h1>
            <p className="mt-3 text-center text-slate-400">
              Saisissez le code à 4 caractères reçu à l'accueil pour démarrer votre session.
            </p>

            <div className="mt-8">
              <TextField
                id="code"
                label="Code de session"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ex. A3F9"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="mt-4">
                <Alert kind="error">{error}</Alert>
              </div>
            )}

            <div className="mt-8">
              <Button type="submit" loading={submitting} disabled={codeInput.trim().length !== 4}>
                <FiLogIn /> Démarrer
              </Button>
            </div>

            {!stationCode && (
              <p className="mt-6 text-center text-xs text-slate-500">
                Astuce : ouvrez cette page avec{' '}
                <span className="font-mono text-slate-400">?station=PC-01</span> dans l'URL pour
                définir ce poste.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
