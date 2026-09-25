import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

const fallbackProfile = {
  aboutHeading: 'Building ideas into real applications.',
  aboutDescription:
    "I'm a Junior Software Engineer and Full-Stack Developer passionate about building modern, scalable and user-friendly web applications.",
  bio: 'I enjoy working across the frontend and backend, solving problems with clean code and continuously learning new technologies.',
};

function About({ profile: propProfile }) {
  const [profile, setProfile] = useState(propProfile || null);
  const [loading, setLoading] = useState(!propProfile);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
      setLoading(false);
      return;
    }

    let isMounted = true;
    portfolioService
      .getProfile()
      .then((data) => {
        if (isMounted) {
          setProfile(data || fallbackProfile);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setProfile(fallbackProfile);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [propProfile]);

  const activeProfile = profile || fallbackProfile;

  return (
    <section
      id="about"
      className="bg-[#F8FAFC] px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Get to know me
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            About Me
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />
        </div>

        {/* Subtle loading notice */}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-cyan-400">
              <span className="inline-block h-2.5 w-2.5 animate-ping rounded-full bg-blue-600 dark:bg-cyan-400" />
              Loading profile details...
            </div>
          </div>
        )}

        {error && !profile && (
          <div className="mx-auto mb-6 max-w-md rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-xs text-yellow-600 dark:text-yellow-300">
            Using cached details (Backend notice: {error})
          </div>
        )}

        {/* Content Grid */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left Narrative */}
          <div className="space-y-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
              {activeProfile.aboutHeading ? (
                <span>{activeProfile.aboutHeading}</span>
              ) : (
                <>
                  Building ideas into{' '}
                  <span className="text-blue-600 dark:text-cyan-400">real applications.</span>
                </>
              )}
            </h3>

            <p className="pt-2">
              {activeProfile.aboutDescription || fallbackProfile.aboutDescription}
            </p>

            <p>
              My primary focus is developing responsive, production-ready web applications using
              React, Node.js, Express.js, MongoDB, and modern software architecture patterns.
            </p>
          </div>

          {/* Right Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/30">
              <h4 className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400">10+</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Projects Built
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/30">
              <h4 className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400">2+</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Years Learning
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/30">
              <h4 className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400">10+</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Technologies
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/30">
              <h4 className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400">∞</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Curiosity to Learn
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;