import picture from '../assets/Pic.jpeg';
import { Link } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

function Hero({ profile }) {
  const name = profile?.name || 'Saumya Verma';
  const title = profile?.title || 'Junior Software Engineer | Full-Stack Developer';
  const tagline = profile?.tagline || 'Welcome to my portfolio';
  const bio =
    profile?.bio ||
    'I build modern, scalable and user-friendly web applications using modern frontend and backend technologies.';
  const avatar = profile?.avatar || picture;
  const githubUrl = profile?.githubUrl || '#';
  const linkedinUrl = profile?.linkedinUrl || '#';
  const twitterUrl = profile?.twitterUrl || '';
  const resumeUrl = profile?.resumeUrl || '';
  const email = profile?.email ? `mailto:${profile.email}` : 'mailto:yourmail@example.com';

  return (
    <section
      id="home"
      className="flex min-h-screen items-center bg-[#F8FAFC] px-5 pt-28 pb-16 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white md:px-8 md:pt-28 md:pb-20"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ================= LEFT CONTENT ================= */}
        <div className="text-center lg:text-left">
          <div className="animate-hero-tagline inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-cyan-400" />
            <span>{tagline}</span>
          </div>

          <h1 className="animate-hero-heading mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Hi, I'm{' '}
            <span className="text-blue-600 dark:text-cyan-400">{name}</span>
          </h1>

          <h2 className="animate-hero-subtitle mx-auto mt-4 max-w-2xl text-xl font-semibold leading-snug text-slate-700 sm:text-2xl dark:text-slate-200 lg:mx-0 lg:text-3xl">
            {title}
          </h2>

          <p className="animate-hero-bio mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-400 lg:mx-0">
            {bio}
          </p>

          {/* CTA Buttons */}
          <div className="animate-hero-buttons mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#projects"
              className="w-full rounded-full bg-blue-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:hover:shadow-cyan-400/20 dark:focus-visible:outline-cyan-400 sm:w-auto"
            >
              View My Work
            </a>

            {resumeUrl ? (
              <Link
                to="/resume"
                id="hero-view-resume-btn"
                className="w-full rounded-full border border-slate-300 bg-white px-7 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-600 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-400 dark:hover:shadow-cyan-400/10 dark:focus-visible:outline-cyan-400 sm:w-auto"
              >
                View Resume
              </Link>
            ) : (
              <span
                title="Resume not yet available"
                className="w-full cursor-not-allowed rounded-full border border-slate-200 bg-white px-7 py-3 text-center text-sm font-semibold text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500 sm:w-auto"
              >
                View Resume
              </span>
            )}

            <a
              href="#contact"
              className="w-full rounded-full border border-slate-300 bg-white px-7 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-600 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-400 dark:hover:shadow-cyan-400/10 dark:focus-visible:outline-cyan-400 sm:w-auto"
            >
              Contact Me
            </a>
          </div>

          {/* Social Links */}
          <div className="animate-hero-socials mt-8 flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-slate-500 dark:text-slate-400 lg:justify-start">
            <a
              href={githubUrl}
              target={githubUrl !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              onClick={() => analyticsService.trackLinkClick('github_click', { url: githubUrl })}
              className="transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:hover:text-cyan-400"
            >
              GitHub
            </a>

            <span className="text-slate-300 dark:text-slate-700">•</span>

            <a
              href={linkedinUrl}
              target={linkedinUrl !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              onClick={() => analyticsService.trackLinkClick('linkedin_click', { url: linkedinUrl })}
              className="transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:hover:text-cyan-400"
            >
              LinkedIn
            </a>

            {twitterUrl && twitterUrl !== '#' ? (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:hover:text-cyan-400"
                >
                  Twitter / X
                </a>
              </>
            ) : null}

            <span className="text-slate-300 dark:text-slate-700">•</span>

            <a
              href={email}
              onClick={() => analyticsService.trackLinkClick('email_click')}
              className="transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:hover:text-cyan-400"
            >
              Email
            </a>
          </div>
        </div>

        {/* ================= RIGHT PROFILE CARD ================= */}
        <div className="flex justify-center">
          <div className="animate-hero-card w-full max-w-[320px] rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:border-white/10 dark:bg-[#111827] dark:shadow-2xl sm:max-w-[360px] sm:p-8">
            {/* Profile Image Container with gentle floating motion */}
            <div className="animate-float-slow mx-auto mb-6 h-48 w-48 overflow-hidden rounded-full border-2 border-blue-600 p-1 dark:border-cyan-400 sm:h-56 sm:w-56">
              <img
                src={avatar}
                alt={name}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  if (e.currentTarget.src !== picture) {
                    e.currentTarget.src = picture;
                  }
                }}
              />
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{name}</h3>

            {/* Role */}
            <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {title.split('|')[0].trim()}
            </p>

            {/* Small divider */}
            <div className="mx-auto mt-5 h-0.5 w-12 rounded-full bg-blue-600/40 dark:bg-cyan-400/50" />

            <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">
              {profile?.aboutDescription ||
                'Full-Stack Developer passionate about building modern web applications.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;