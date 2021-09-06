/* Simple two-column auth layout: brand panel (left) + form panel (right).
   Stacks vertically on small screens. */

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left panel — brand */}
      <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-600 p-12">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="DenkoCyber" width="36" height="36" />
          <span className="text-lg font-bold text-white">DenkoCyber</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-snug text-white">
            Votre cybercafé, piloté d'un seul écran.
          </h2>
          <p className="mt-4 max-w-sm text-brand-100">
            Gérez vos postes et suivez les appareils de vos clients en temps réel.
          </p>
        </div>

        <p className="text-xs text-brand-200">© 2021 DenkoCyber — v1.0.0</p>
      </aside>

      {/* Right panel — form */}
      <main className="flex w-full flex-1 items-center justify-center bg-ink-900 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Compact brand header for mobile */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <img src="/logo.svg" alt="DenkoCyber" width="32" height="32" />
            <span className="text-lg font-bold text-white">DenkoCyber</span>
          </div>

          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
