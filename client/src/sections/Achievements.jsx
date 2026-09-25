import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function AchievementCard({ achievement, index }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(achievement.image) && !imageError;

  return (
    <article
      id={`achievement-card-${achievement._id || index}`}
      className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-xl dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40 dark:hover:shadow-cyan-400/5"
    >
      {/* Optional Achievement Image / Trophy Emblem */}
      {hasImage ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-white/10 aspect-[16/10]">
          <img
            src={achievement.image}
            alt={achievement.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-2xl font-bold text-amber-500 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
      )}

      {/* Header & Title */}
      <h3 className="text-lg font-bold tracking-tight text-[#0F172A] transition duration-200 group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-400">
        {achievement.title}
      </h3>

      {/* Description */}
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {achievement.description}
      </p>
    </article>
  );
}

export function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievements = () => {
    setLoading(true);
    setError(null);
    portfolioService
      .getAchievements()
      .then((data) => {
        const activeItems = (data || []).filter((item) => item.isActive !== false);
        activeItems.sort((a, b) => {
          const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (typeof a.order === 'number' ? a.order : 0);
          const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (typeof b.order === 'number' ? b.order : 0);
          return orderA - orderB;
        });
        setAchievements(activeItems);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load achievements.');
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getAchievements()
      .then((data) => {
        if (!isMounted) return;
        const activeItems = (data || []).filter((item) => item.isActive !== false);
        activeItems.sort((a, b) => {
          const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (typeof a.order === 'number' ? a.order : 0);
          const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (typeof b.order === 'number' ? b.order : 0);
          return orderA - orderB;
        });
        setAchievements(activeItems);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Unable to load achievements.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="achievements"
      className="bg-[#F8FAFC] px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Honors & Milestones
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Key Achievements
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
            A track record of hackathons, academic excellence, competition wins, and professional accomplishments.
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="mb-5 h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load achievements
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchAchievements}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && achievements.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl dark:border-white/10 dark:bg-slate-800">
              🏆
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No achievements published yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Awards and key career milestones will appear here soon.
            </p>
          </div>
        )}

        {/* Achievements Grid */}
        {!loading && !error && achievements.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement._id || `achievement-${index}`}
                achievement={achievement}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Achievements;
