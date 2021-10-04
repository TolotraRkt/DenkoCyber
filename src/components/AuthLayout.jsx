/* Simple two-column auth layout: brand panel (left) + form panel (right).
   Stacks vertically on small screens. Sober slate palette with a blue accent. */

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 lg:flex-row">
      {/* Left panel — brand (slate surface + thin blue accent bar) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-900 px-14 py-14 lg:flex lg:w-1/2 xl:px-20">
        <span className="absolute inset-y-0 right-0 w-1 bg-blue-600" />

        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="DenkoCyber" width="52" height="52" />
          <span className="text-2xl font-bold tracking-tight text-slate-100">DenkoCyber</span>
        </div>

        <div className="max-w-xl">
          <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-100 xl:text-6xl">
            Votre cybercafé, <span className="text-blue-400">piloté d'un seul écran.</span>
          </h2>
          <p className="mt-8 text-xl leading-relaxed text-slate-400 xl:text-2xl">
            Gérez vos postes et suivez les appareils de vos clients en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-px w-8 bg-blue-500/70" />
          <p>© 2021 DenkoCyber. Tous droits réservés.</p>
        </div>
      </aside>

      {/* Right panel — form */}
      <main className="flex w-full flex-1 items-center justify-center bg-slate-950 px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Compact brand header for mobile */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <img src="/logo.svg" alt="DenkoCyber" width="40" height="40" />
            <span className="text-xl font-bold text-slate-100">DenkoCyber</span>
          </div>

          <span className="mb-6 block h-1 w-16 rounded-full bg-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">{title}</h1>
          {subtitle && <p className="mt-3 text-base leading-relaxed text-slate-400">{subtitle}</p>}

          <div className="mt-10">{children}</div>
        </div>
      </main>
    </div>
  )
}
