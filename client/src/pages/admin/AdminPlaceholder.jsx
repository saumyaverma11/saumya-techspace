import { useLocation, Link } from 'react-router-dom';

export function AdminPlaceholder() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const sectionName =
    pathSegments[pathSegments.length - 1]?.replace(/-/g, ' ') || 'Management';

  const capitalizedSection =
    sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 shadow-xl shadow-cyan-400/10">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {capitalizedSection} Management
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        The {capitalizedSection} CRUD management interface will be activated in upcoming phases. The protected dashboard foundation and authorization are ready.
      </p>

      <div className="mt-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <span>&larr;</span> Back to Dashboard Overview
        </Link>
      </div>
    </div>
  );
}

export default AdminPlaceholder;
