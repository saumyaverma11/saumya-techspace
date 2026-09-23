import analyticsService from '../services/analyticsService';

function Footer({ profile }) {
  const brandName = profile?.name ? profile.name.split(' ')[0] : 'Saumya';
  const fullName = profile?.name || 'Saumya Verma';
  const title = profile?.title || 'Junior Software Engineer | Full-Stack Developer';
  const githubUrl = profile?.githubUrl || '#';
  const linkedinUrl = profile?.linkedinUrl || '#';
  const email = profile?.email ? `mailto:${profile.email}` : 'mailto:yourmail@example.com';

  const footerLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Education', href: '#education' },
    { label: 'Certifications', href: '#certifications' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-white transition-colors duration-200 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand Column */}
          <div>
            <a href="#home" className="text-2xl font-bold tracking-tight">
              {brandName}
              <span className="text-blue-500 dark:text-cyan-400">.</span>
            </a>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              {title}. Focused on creating clean, scalable, and user-friendly digital experiences.
            </p>

            <p className="mt-3 text-xs font-semibold text-blue-400 dark:text-cyan-400">
              Let's build something great together.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Links
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-400 transition hover:text-blue-400 dark:hover:text-cyan-400"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Connect
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Feel free to connect or reach out regarding engineering roles, collaborations, or tech discussions.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href={githubUrl}
                target={githubUrl !== '#' ? '_blank' : undefined}
                rel="noreferrer"
                onClick={() => analyticsService.trackLinkClick('github_click', { url: githubUrl })}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-400 hover:text-blue-400 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                GitHub
              </a>

              <a
                href={linkedinUrl}
                target={linkedinUrl !== '#' ? '_blank' : undefined}
                rel="noreferrer"
                onClick={() => analyticsService.trackLinkClick('linkedin_click', { url: linkedinUrl })}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-400 hover:text-blue-400 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                LinkedIn
              </a>

              <a
                href={email}
                onClick={() => analyticsService.trackLinkClick('email_click')}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-400 hover:text-blue-400 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-800 dark:bg-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col gap-3 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} {fullName}. All rights reserved.</p>

          <a
            href="#home"
            className="inline-flex items-center justify-center gap-1 font-medium transition hover:text-blue-400 dark:hover:text-cyan-400"
          >
            <span>Back to top</span>
            <span>&uarr;</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;