import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

const fallbackProfile = {
  aboutHeading: 'Building ideas into real applications.',
  aboutDescription: "I'm a Junior Software Engineer and Full-Stack Developer passionate about building modern, scalable and user-friendly web applications.",
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
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Get to know me
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            About Me
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Loading / Error indicator if any (non-intrusive) */}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 text-sm text-cyan-400">
              <span className="inline-block h-3 w-3 animate-ping rounded-full bg-cyan-400" />
              Loading profile details...
            </div>
          </div>
        )}

        {error && !profile && (
          <div className="mb-6 mx-auto max-w-md rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-xs text-yellow-300">
            Using cached details (Backend notice: {error})
          </div>
        )}

        {/* Content */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Left */}
          <div>
            <h3 className="text-2xl font-semibold sm:text-3xl">
              {activeProfile.aboutHeading ? (
                <span>{activeProfile.aboutHeading}</span>
              ) : (
                <>
                  Building ideas into{' '}
                  <span className="text-cyan-400">real applications.</span>
                </>
              )}
            </h3>

            <p className="mt-6 leading-7 text-slate-400">
              {activeProfile.aboutDescription || fallbackProfile.aboutDescription}
            </p>

            <p className="mt-4 leading-7 text-slate-400">
              {activeProfile.bio || fallbackProfile.bio}
            </p>

            <p className="mt-4 leading-7 text-slate-400">
              My current focus is on developing production-ready applications
              using React, Node.js, Express.js, MongoDB and other modern
              technologies.
            </p>
          </div>

          {/* Right */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">10+</h4>
              <p className="mt-2 text-sm text-slate-400">Projects Built</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">2+</h4>
              <p className="mt-2 text-sm text-slate-400">Years Learning</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">10+</h4>
              <p className="mt-2 text-sm text-slate-400">Technologies</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">∞</h4>
              <p className="mt-2 text-sm text-slate-400">Curiosity to Learn</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;