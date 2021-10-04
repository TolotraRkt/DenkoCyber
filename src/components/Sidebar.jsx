/* Barre de navigation latérale gauche.
   Chaque entrée affiche son icône et, en dessous, son libellé. */
import { NavLink } from 'react-router-dom'
import { FiGrid, FiMonitor, FiLogOut, FiClock } from 'react-icons/fi'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/* Définition des entrées du menu.
   `end` force la correspondance exacte pour la route racine du dashboard. */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', icon: FiGrid, end: true },
  { to: '/session/new', label: 'Session', icon: FiMonitor, end: false },
  { to: '/history', label: 'Historique', icon: FiClock, end: false },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const history = useHistory()

  function handleLogout() {
    logout()
    history.replace('/login')
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="flex h-full w-24 flex-shrink-0 flex-col items-center border-r border-slate-800 bg-slate-900"
    >
      {/* Logo en haut */}
      <div className="flex h-20 w-full flex-shrink-0 items-center justify-center border-b border-slate-800">
        <img src="/logo.svg" alt="DenkoCyber" width="36" height="36" />
      </div>

      {/* Entrées : icône au-dessus, libellé en dessous */}
      <ul className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="w-full">
            <NavLink
              to={to}
              exact={end}
              className="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-3 text-center text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              activeClassName="bg-blue-600 text-white hover:bg-blue-600"
            >
              <Icon size={22} />
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Déconnexion, en bas */}
      <div className="w-full flex-shrink-0 border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-3 text-slate-400 transition hover:text-red-400"
        >
          <FiLogOut size={22} />
          <span className="text-[11px] font-medium leading-tight">Déconnexion</span>
        </button>
      </div>
    </nav>
  )
}
