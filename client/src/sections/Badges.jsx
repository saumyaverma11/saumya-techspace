import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function BadgeCard({ badge, index }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(badge.image) && !imageError;

  return (
    <article
      id={`badge-card-${badge._id || index}`}
      className="group flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-xl dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40 dark:hover:shadow-cyan-400/5"
    >
      {/* Badge Image / Emblem */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center">
        {hasImage ? (
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-white/10 dark:bg-slate-900">
            <img
              src={badge.image}
              alt={badge.title}
              className="h-full w-full object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-50 text-3xl font-bold text-blue-600 shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Badge Title */}
      <h3 className="text-base font-bold tracking-tight text-[#0F172A] transition duration-200 group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-400">
        {badge.title}
      </h3>

      {/* Badge Description */}
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        {badge.description}
      </p>
    </article>
  );
}

export function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBadges = () => {
    setLoading(true);
    setError(null);
    portfolioService
      .getBadges()
      .then((data) => {
        const activeItems = (data || []).filter((item) => item.isActive !== false);
        activeItems.sort((a, b) => {
          const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (typeof a.order === 'number' ? a.order : 0);
          const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (typeof b.order === 'number' ? b.order : 0);
          return orderA - orderB;
        });
        setBadges(activeItems);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load badges.');
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getBadges()
      .then((data) => {
        if (!isMounted) return;
        const activeItems = (data || []).filter((item) => item.isActive !== false);
        activeItems.sort((a, b) => {
          const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (typeof a.order === 'number' ? a.order : 0);
          const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (typeof b.order === 'number' ? b.order : 0);
          return orderA - orderB;
        });
        setBadges(activeItems);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Unable to load badges.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="badges"
      className="bg-slate-100/80 px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0F172A] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Recognitions & Credentials
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Verified Badges
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
            Digital emblems, developer community recognitions, and verified skill badges earned across platforms.
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="mb-4 h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load badges
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchBadges}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && badges.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl dark:border-white/10 dark:bg-slate-800">
              🛡️
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No badges published yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Verified badges and community recognitions will appear here.
            </p>
          </div>
        )}

        {/* Badges Grid */}
        {!loading && !error && badges.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {badges.map((badge, index) => (
              <BadgeCard
                key={badge._id || `badge-${index}`}
                badge={badge}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Badges;
