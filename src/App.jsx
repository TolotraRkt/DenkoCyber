import { useState } from 'react'
import { useAuth } from './context/useAuth.js'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('login') // 'login' | 'register'

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 text-slate-400">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="DenkoCyber" width="32" height="32" className="animate-pulse" />
          <span>Chargement…</span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Dashboard />
  }

  if (view === 'register') {
    return <Register onSwitch={() => setView('login')} />
  }
  return <Login onSwitch={() => setView('register')} />
}

export default App
