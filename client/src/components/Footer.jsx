function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-white">

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">

        {/* Main Footer */}
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <a
              href="#home"
              className="text-2xl font-bold"
            >
              Saumya<span className="text-cyan-400">.</span>
            </a>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Junior Software Engineer and Full-Stack Developer passionate
              about building modern, scalable and user-friendly applications.
            </p>

            <p className="mt-4 text-sm text-cyan-400">
              Let's build something great together.
            </p>
          </div>


          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">

              <a
                href="#home"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Home
              </a>

              <a
                href="#about"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                About
              </a>

              <a
                href="#skills"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Skills
              </a>

              <a
                href="#projects"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Projects
              </a>

              <a
                href="#experience"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Experience
              </a>

              <a
                href="#education"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Education
              </a>

              <a
                href="#certifications"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Certifications
              </a>

              <a
                href="#contact"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Contact
              </a>

            </div>
          </div>


          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Connect
            </h3>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Interested in working together or have an opportunity?
              Feel free to reach out.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
              >
                GitHub
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
              >
                LinkedIn
              </a>

              <a
                href="mailto:yourmail@example.com"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
              >
                Email
              </a>

            </div>
          </div>

        </div>


        {/* Divider */}
        <div className="my-10 h-px bg-white/10" />


        {/* Bottom Footer */}
        <div className="flex flex-col gap-3 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">

          <p>
            © {new Date().getFullYear()} Saumya Verma. All rights reserved.
          </p>

          <a
            href="#home"
            className="transition hover:text-cyan-400"
          >
            Back to top ↑
          </a>

        </div>

      </div>

    </footer>
  )
}

export default Footer