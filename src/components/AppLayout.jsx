/* Layout principal des pages authentifiées :
   barre de navigation à gauche + contenu de la page à droite. */
import Sidebar from './Sidebar.jsx'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
