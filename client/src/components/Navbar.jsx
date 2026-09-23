import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Navbar({ profile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const brandName = profile?.name ? profile.name.split(' ')[0] : 'Saumya';
  const hasResume = Boolean(profile?.resumeUrl);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Education', href: '#education' },
    { label: 'Certifications', href: '#certifications' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-[#F8FAFC]/90 backdrop-blur-md transition-colors duration-200 dark:border-white/10 dark:bg-[#0B1220]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
        {/* Brand Logo */}
        <a
          href="#home"
          className="text-xl font-bold tracking-tight text-[#0F172A] transition hover:opacity-90 dark:text-white"
        >
          {brandName}
          <span className="text-blue-600 dark:text-cyan-400">.</span>
        </a>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400"
            >
              {link.label}
            </a>
          ))}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:scale-105 hover:border-blue-500 hover:text-blue-600 active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-400"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Resume CTA */}
          {hasResume ? (
            <Link
              to="/resume"
              id="navbar-resume-btn"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-md active:translate-y-0 active:scale-[0.99] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Resume
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-full bg-blue-600/40 px-5 py-2 text-sm font-semibold text-white/60 dark:bg-cyan-400/30 dark:text-slate-950/50">
              Resume
            </span>
          )}
        </div>

        {/* ================= MOBILE CONTROLS ================= */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU DRAWER ================= */}
      {isMenuOpen && (
        <div className="animate-fade-in border-t border-slate-200 bg-[#F8FAFC] px-5 py-5 shadow-xl dark:border-white/10 dark:bg-[#0B1220] lg:hidden">
          <div className="flex flex-col space-y-3">
            <a
              href="#home"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400"
            >
              Home
            </a>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-2">
              {hasResume ? (
                <Link
                  to="/resume"
                  id="navbar-mobile-resume-btn"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  Resume
                </Link>
              ) : (
                <span className="block w-full cursor-not-allowed rounded-xl bg-blue-600/40 px-4 py-2.5 text-center text-sm font-semibold text-white/60 dark:bg-cyan-400/30">
                  Resume
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;