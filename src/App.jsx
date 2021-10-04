import { Redirect, Route, Switch } from 'react-router-dom'
import { useAuth } from './context/useAuth.js'
import AppLayout from './components/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewSession from './pages/NewSession.jsx'
import History from './pages/History.jsx'
import Station from './pages/Station.jsx'

/* A route that requires an authenticated user.
   While the token is being validated we show a loader; unauthenticated
   visitors are redirected to /login. */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="DenkoCyber" width="32" height="32" className="animate-pulse" />
          <span>Chargement…</span>
        </div>
      </div>
    )
  }

  return user ? <AppLayout>{children}</AppLayout> : <Redirect to="/login" />
}

/* Public routes: if already authenticated, bounce to the dashboard. */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  return user ? <Redirect to="/dashboard" /> : children
}

function App() {
  return (
    <Switch>
      <Route exact path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      <Route exact path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>
      <Route exact path="/dashboard">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>
      <Route exact path="/session/new">
        <PrivateRoute>
          <NewSession />
        </PrivateRoute>
      </Route>
      <Route exact path="/history">
        <PrivateRoute>
          <History />
        </PrivateRoute>
      </Route>
      {/* Écran du poste client : accessible sans compte (chaque PC l'ouvre
          avec ?station=PC-XX). Le backend reste protégé par token. */}
      <Route exact path="/station">
        <Station />
      </Route>
      <Route path="*">
        <Redirect to="/dashboard" />
      </Route>
    </Switch>
  )
}

export default App
