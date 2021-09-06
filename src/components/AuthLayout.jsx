/* Simple two-column auth layout: brand panel (left) + form panel (right).
   Stacks vertically on small screens. */

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left panel — brand */}
      <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 bg-grid px-14 py-14 xl:px-20">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="DenkoCyber" width="52" height="52" />
          <span className="text-2xl font-bold tracking-tight text-white">DenkoCyber</span>
        </div>

        <div className="max-w-xl">
          <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-6xl">
            Votre cybercafé, <span className="text-accent-400">piloté d'un seul écran.</span>
          </h2>
          <p className="mt-8 text-xl leading-relaxed text-white/85 xl:text-2xl">
            Gérez vos postes et suivez les appareils de vos clients en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="h-px w-8 bg-accent-400/70" />
          <p>
            © 2021 DenkoCyber. Tous droits réservés.
          </p>
        </div>
      </aside>

      {/* Right panel — form */}
      <main className="flex w-full flex-1 items-center justify-center bg-ink-900 px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Compact brand header for mobile */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <img src="/logo.svg" alt="DenkoCyber" width="40" height="40" />
            <span className="text-xl font-bold text-white">DenkoCyber</span>
          </div>

          <span className="mb-6 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
          <h1 className="text-4xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-3 text-base leading-relaxed text-slate-400">{subtitle}</p>}

          <div className="mt-10">{children}</div>
        </div>
      </main>
    </div>
  )
}
