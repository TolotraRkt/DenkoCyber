import { useEffect, useMemo, useState } from 'react'
import { FiMonitor, FiCopy, FiCheck, FiEdit2, FiX, FiPlus } from 'react-icons/fi'
import { Alert, Button, TextField } from '../components/ui.jsx'
import { sessionsApi, stationsApi } from '../services/api.js'

/* Tarif par défaut : 30 Ariary par minute (utilisé tant qu'aucun poste n'est choisi). */
const DEFAULT_RATE_PER_MINUTE = 30

/* Style associé à chaque statut de poste. */
const STATUS_STYLES = {
  free: { label: 'Libre', ring: 'border-emerald-500/40', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  busy: { label: 'Occupé', ring: 'border-amber-500/40', dot: 'bg-amber-400', text: 'text-amber-300' },
  offline: { label: 'Hors ligne', ring: 'border-slate-700', dot: 'bg-slate-500', text: 'text-slate-400' },
}

/* Arrondit à 2 décimales sans erreurs de virgule flottante. */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/* Formate un nombre pour l'affichage dans un champ (pas de séparateur). */
function formatNumber(value) {
  return Number.isFinite(value) ? String(round2(value)) : ''
}

/* Analyse une saisie utilisateur : accepte "12,5" comme "12.5". */
function parseAmount(raw) {
  const normalized = raw.replace(',', '.').trim()
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? value : NaN
}

/* Formate un nombre de secondes en HH:MM:SS (ou MM:SS sous une heure). */
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/* Intervalle de rafraîchissement de l'état des postes (ms). */
const STATIONS_POLL_INTERVAL = 5000

export default function NewSession() {
  const [minutes, setMinutes] = useState('')
  const [amount, setAmount] = useState('')
  // Liste des postes chargée depuis le backend.
  const [stations, setStations] = useState([])
  const [loadingStations, setLoadingStations] = useState(true)
  // Poste sélectionné (objet complet, pour récupérer son tarif).
  const [selectedStation, setSelectedStation] = useState(null)
  // Code renvoyé par le serveur, affiché une fois la demande validée.
  const [code, setCode] = useState('')
  // Tarif courant (Ar/min) et état d'édition inline.
  const [rate, setRate] = useState(DEFAULT_RATE_PER_MINUTE)
  const [editingRate, setEditingRate] = useState(false)
  const [rateDraft, setRateDraft] = useState(String(DEFAULT_RATE_PER_MINUTE))
  // Indique que le code vient d'être copié (retour visuel temporaire).
  const [copied, setCopied] = useState(false)
  // Envoi de la demande au serveur + éventuel message d'erreur.
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // État temps réel de chaque poste : { [code]: { status, session, remaining } }.
  const [liveStations, setLiveStations] = useState({})
  // Code du poste en cours de libération (pour l'indicateur de chargement).
  const [releasing, setReleasing] = useState(null)
  // Modale « prolonger » : { stationCode, sessionCode } ou null.
  const [extendTarget, setExtendTarget] = useState(null)
  const [extendMinutes, setExtendMinutes] = useState('15')
  const [extending, setExtending] = useState(false)

  // Charge les postes au montage. Si la base est vide, on lance le seed.
  useEffect(() => {
    let active = true
    async function load() {
      try {
        let list = await stationsApi.list()
        if (list.length === 0) list = await stationsApi.seed()
        if (active) setStations(list)
      } catch (err) {
        if (active) setError(err.message || 'Impossible de charger les postes.')
      } finally {
        if (active) setLoadingStations(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Récupère l'état temps réel de tous les postes en un seul appel.
  useEffect(() => {
    if (stations.length === 0) return undefined
    let active = true

    async function refresh() {
      try {
        const data = await stationsApi.liveAll()
        if (!active) return
        const next = {}
        data.stations.forEach((item) => {
          next[item.station.code] = {
            status: item.station.status,
            session: item.session,
            remaining: item.remaining_seconds,
          }
        })
        setLiveStations(next)
      } catch {
        /* erreur réseau transitoire : on réessaiera au prochain tick */
      }
    }

    refresh()
    const id = window.setInterval(refresh, STATIONS_POLL_INTERVAL)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [stations])

  // Décompte local seconde par seconde pour un chrono fluide sur les cartes.
  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveStations((prev) => {
        const next = {}
        let changed = false
        for (const [code, info] of Object.entries(prev)) {
          if (info.remaining !== null && info.remaining !== undefined && info.remaining > 0) {
            next[code] = { ...info, remaining: info.remaining - 1 }
            changed = true
          } else {
            next[code] = info
          }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  // Sélectionne un poste et adopte son tarif horaire.
  function selectStation(station) {
    setSelectedStation(station)
    setRate(station.rate_per_minute)
    setRateDraft(String(station.rate_per_minute))
    // Recalcule le montant si une durée est déjà saisie.
    const m = parseAmount(minutes)
    if (m !== null && !Number.isNaN(m)) setAmount(formatNumber(m * station.rate_per_minute))
  }

  function handleMinutesChange(event) {
    const raw = event.target.value
    setMinutes(raw)
    const parsed = parseAmount(raw)
    if (parsed === null) setAmount('')
    else if (!Number.isNaN(parsed)) setAmount(formatNumber(parsed * rate))
  }

  function handleAmountChange(event) {
    const raw = event.target.value
    setAmount(raw)
    const parsed = parseAmount(raw)
    if (parsed === null) setMinutes('')
    else if (!Number.isNaN(parsed)) setMinutes(formatNumber(parsed / rate))
  }

  /* Termine la session en cours sur un poste (arrêt anticipé par l'opérateur). */
  async function releaseSession(stationCode, sessionCode) {
    if (!sessionCode) return
    setError('')
    setReleasing(stationCode)
    try {
      await sessionsApi.stop(sessionCode)
      // Rafraîchit immédiatement l'état des postes.
      const data = await stationsApi.liveAll()
      const next = {}
      data.stations.forEach((item) => {
        next[item.station.code] = {
          status: item.station.status,
          session: item.session,
          remaining: item.remaining_seconds,
        }
      })
      setLiveStations(next)
    } catch (err) {
      setError(err.message || 'Impossible de libérer ce poste.')
    } finally {
      setReleasing(null)
    }
  }

  /* Ouvre la modale de prolongation pour une session donnée. */
  function openExtend(stationCode, sessionCode) {
    setError('')
    setExtendTarget({ stationCode, sessionCode })
    setExtendMinutes('15')
  }

  /* Valide la prolongation : ajoute les minutes choisies à la session. */
  async function confirmExtend() {
    if (!extendTarget) return
    const extra = parseAmount(extendMinutes)
    if (extra === null || Number.isNaN(extra) || extra <= 0) {
      setError('Veuillez saisir une durée valide (minutes).')
      return
    }
    setExtending(true)
    setError('')
    try {
      await sessionsApi.extend(extendTarget.sessionCode, extra)
      // Rafraîchit immédiatement l'état des postes.
      const data = await stationsApi.liveAll()
      const next = {}
      data.stations.forEach((item) => {
        next[item.station.code] = {
          status: item.station.status,
          session: item.session,
          remaining: item.remaining_seconds,
        }
      })
      setLiveStations(next)
      setExtendTarget(null)
    } catch (err) {
      setError(err.message || 'Impossible de prolonger cette session.')
    } finally {
      setExtending(false)
    }
  }

  /* Ouvre l'édition inline du tarif. */
  function startEditRate() {
    setRateDraft(String(rate))
    setEditingRate(true)
  }

  /* Valide le nouveau tarif et recalcule le montant depuis la durée. */
  function commitRate() {
    const parsed = parseAmount(rateDraft)
    if (parsed !== null && !Number.isNaN(parsed) && parsed > 0) {
      setRate(parsed)
      const m = parseAmount(minutes)
      if (m !== null && !Number.isNaN(m)) setAmount(formatNumber(m * parsed))
    }
    setEditingRate(false)
  }

  function cancelEditRate() {
    setEditingRate(false)
  }

  function handleRateKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRate()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditRate()
    }
  }

  // Résumé live (affiché uniquement quand les deux valeurs sont valides).
  const summary = useMemo(() => {
    const m = parseAmount(minutes)
    const a = parseAmount(amount)
    if (m === null || a === null || Number.isNaN(m) || Number.isNaN(a) || m <= 0) return null
    return { minutes: m, amount: a }
  }, [minutes, amount])

  // Nouvelle demande : le serveur génère un code unique pour la session.
  async function handleRequest(event) {
    event.preventDefault()
    if (!summary || submitting) return
    setError('')
    setSubmitting(true)
    try {
      const created = await sessionsApi.create({
        station_id: selectedStation ? selectedStation.code : 'N/A',
        minutes: summary.minutes,
        amount: summary.amount,
        rate_per_minute: rate,
      })
      setCode(created.code)
    } catch (err) {
      setError(err.message || "Échec de la création de la session.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setCode('')
    setMinutes('')
    setAmount('')
    setSelectedStation(null)
    setCopied(false)
    setError('')
  }

  /* Copie le code dans le presse-papier et affiche un retour visuel. */
  async function handleCopyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Repli pour les navigateurs sans API clipboard (ou contexte non sécurisé).
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      document.body.removeChild(textarea)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full w-full flex-col px-6 py-8 sm:px-10 lg:px-12">
      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-2">
        {/* Colonne gauche — création de session (scroll indépendant) */}
        <section className="no-scrollbar flex min-h-0 flex-col overflow-y-auto pr-1">
          {code ? (
            /* Écran de confirmation : le code à donner au client */
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {/* Mini bouton icône : copie le code */}
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copier le code"
                title={copied ? 'Copié !' : 'Copier le code'}
                className="mb-4 grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
              >
                {copied ? <FiCheck size={18} className="text-emerald-400" /> : <FiCopy size={18} />}
              </button>
              <p className="text-sm uppercase tracking-widest text-blue-400">Votre code</p>
              <p className="mt-4 select-all font-mono text-7xl font-extrabold tracking-[0.3em] text-slate-100 sm:text-8xl">
                {code}
              </p>
              <p className="mt-6 text-slate-300">
                {summary.minutes} min — {summary.amount} Ar
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedStation ? `Poste ${selectedStation.code} — ` : ''}
                Donnez ce code au client pour démarrer sa session.
              </p>
              <div className="mt-10 w-full max-w-sm">
                <Button onClick={handleReset}>Nouvelle demande</Button>
              </div>
            </div>
          ) : (
            /* Écran de saisie */
            <>
              <div>
                <span className="mb-4 block h-1 w-16 rounded-full bg-blue-600" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Session</h1>
                <p className="mt-3 text-slate-400">
                  Sélectionnez un poste à droite, puis indiquez une{' '}
                  <span className="font-semibold text-blue-400">durée</span> ou un{' '}
                  <span className="font-semibold text-blue-400">montant</span> : l'autre se calcule
                  automatiquement.
                </p>
              </div>

              {/* Tarif en grand + bouton Modifier au-dessus à droite */}
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-end">
                  {editingRate ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={commitRate}
                        aria-label="Enregistrer le tarif"
                        title="Enregistrer"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500"
                      >
                        <FiCheck size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditRate}
                        aria-label="Annuler la modification du tarif"
                        title="Annuler"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startEditRate}
                      aria-label="Modifier le tarif"
                      title="Modifier le tarif"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
                    >
                      <FiEdit2 size={16} />
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5">
                  {editingRate ? (
                    <div className="flex items-baseline gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rateDraft}
                        onChange={(e) => setRateDraft(e.target.value)}
                        onKeyDown={handleRateKeyDown}
                        onBlur={commitRate}
                        autoFocus
                        className="w-32 rounded-lg border border-slate-600 bg-slate-950 px-3 py-1 text-4xl font-extrabold text-slate-100 outline-none focus:border-blue-500"
                      />
                      <span className="text-xl font-semibold text-slate-300">Ar / minute</span>
                    </div>
                  ) : (
                    <p className="text-4xl font-extrabold tracking-tight text-slate-100">
                      {rate} <span className="text-xl font-semibold text-slate-400">Ar / minute</span>
                    </p>
                  )}
                </div>
              </div>

              <form className="mt-8 flex flex-1 flex-col space-y-6" onSubmit={handleRequest}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <TextField
                    id="minutes"
                    label="Durée (minutes)"
                    type="text"
                    inputMode="decimal"
                    value={minutes}
                    onChange={handleMinutesChange}
                    placeholder="ex. 15"
                  />
                  <TextField
                    id="amount"
                    label="Montant (Ar)"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="ex. 500"
                  />
                </div>

                {summary && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Récapitulatif</p>
                    <p className="mt-2 text-lg text-slate-300">
                      <span className="font-semibold text-slate-100">{summary.minutes} min</span>
                      {' '}pour{' '}
                      <span className="font-semibold text-slate-100">{summary.amount} Ar</span>
                    </p>
                  </div>
                )}

                {error && <Alert kind="error">{error}</Alert>}

                <div className="mt-auto pt-2">
                  <Button type="submit" disabled={!summary} loading={submitting}>
                    Demander
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* Colonne droite — liste des postes (scroll indépendant) */}
        <section className="flex min-h-0 flex-col">
          <div className="mb-4 flex flex-shrink-0 items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Postes</h2>
            <span className="text-sm text-slate-500">
              {loadingStations ? 'Chargement…' : `${stations.length} machines`}
            </span>
          </div>

          <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pb-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {stations.map((station) => {
              // L'état temps réel prime sur le statut chargé une seule fois.
              const live = liveStations[station.code]
              // Un poste n'est « occupé » que s'il a réellement une session active.
              // Sinon (session expirée/terminée), on le traite comme libre — évite
              // l'état incohérent « busy » sans chrono ni code.
              const hasSession = Boolean(live?.session)
              let statusKey = live?.status || station.status
              if (statusKey === 'busy' && !hasSession) statusKey = 'free'
              const status = STATUS_STYLES[statusKey] || STATUS_STYLES.offline
              const isSelected = selectedStation?.id === station.id
              const disabled = statusKey !== 'free'
              const showChrono = hasSession && live.remaining != null
              const cardClass = `flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border bg-slate-900 p-3 text-center transition ${status.ring} ${
                disabled ? '' : 'cursor-pointer hover:border-blue-500/60'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`
              // Poste libre : toute la carte sélectionne le poste.
              // Poste occupé : contenu non cliquable + bouton « Libérer ».
              return disabled ? (
                <div
                  key={station.id}
                  className={`relative h-28 rounded-2xl border bg-slate-900 p-3 transition ${status.ring}`}
                  title={`${station.code} — ${station.rate_per_minute} Ar/min`}
                >
                  {/* Ligne du haut : icône à gauche, actions à droite. */}
                  <div className="flex items-start justify-between">
                    <FiMonitor size={24} className={status.text} />
                    {live?.session?.code && (
                      <div className="flex items-center gap-1">
                        {/* Prolonger la session (+ minutes). */}
                        <button
                          type="button"
                          onClick={() => openExtend(station.code, live.session.code)}
                          aria-label="Prolonger la session"
                          title="Prolonger"
                          className="grid h-6 w-6 place-items-center rounded-full bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/70 transition hover:bg-blue-500/40 hover:text-blue-300 hover:ring-blue-400"
                        >
                          <FiPlus size={13} />
                        </button>
                        {/* Pastille « stop » : termine la session et libère le poste. */}
                        <button
                          type="button"
                          onClick={() => releaseSession(station.code, live.session.code)}
                          disabled={releasing === station.code}
                          aria-label="Terminer la session et libérer le poste"
                          title="Terminer la session"
                          className="grid h-6 w-6 place-items-center rounded-full bg-red-500/20 text-red-400 ring-1 ring-red-500/70 transition hover:bg-red-500/40 hover:text-red-300 hover:ring-red-400 disabled:opacity-40"
                        >
                          {/* Carré « stop » dessiné à la main : parfaitement centré. */}
                          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                            <rect x="0" y="0" width="10" height="10" rx="1.5" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chrono centré : l'élément principal. */}
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center">
                    <p className="font-mono text-2xl font-extrabold leading-none tabular-nums text-amber-300">
                      {showChrono ? formatDuration(live.remaining) : '--:--'}
                    </p>
                  </div>

                  {/* Bas de carte : code poste + code session. */}
                  <div className="absolute inset-x-3 bottom-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                    <span className="font-semibold text-slate-100">{station.code}</span>
                    {live?.session?.code && <span>Code {live.session.code}</span>}
                  </div>
                </div>
              ) : (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => selectStation(station)}
                  title={`${station.code} — ${station.rate_per_minute} Ar/min`}
                  className={cardClass}
                >
                  <FiMonitor size={26} className={status.text} />
                  <span className="text-sm font-semibold text-slate-100">{station.code}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* Modale : prolonger une session en cours. */}
      {extendTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => !extending && setExtendTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-100">
              Prolonger le poste {extendTarget.stationCode}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Code <span className="font-mono text-slate-200">{extendTarget.sessionCode}</span>
            </p>

            <div className="mt-5">
              <TextField
                id="extend-minutes"
                label="Minutes à ajouter"
                type="text"
                inputMode="decimal"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(e.target.value)}
                placeholder="ex. 15"
              />
            </div>

            {/* Raccourcis de durée */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[15, 30, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setExtendMinutes(String(m))}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700"
                >
                  +{m} min
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                disabled={extending}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Annuler
              </button>
              <Button type="button" loading={extending} onClick={confirmExtend}>
                Prolonger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
