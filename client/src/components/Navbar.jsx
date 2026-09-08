import { useState } from 'react'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">

        {/* Logo */}
        <a
          href="#home"
          className="text-xl font-bold text-white"
        >
          Saumya
        </a>


        {/* ================= DESKTOP NAV ================= */}
        <div className="hidden items-center gap-7 md:flex">

          <a
            href="#about"
            className="text-sm text-slate-300 transition hover:text-cyan-400"
          >
            About
          </a>

          <a
            href="#skills"
            className="text-sm text-slate-300 transition hover:text-cyan-400"
          >
            Skills
          </a>

          <a
            href="#projects"
            className="text-sm text-slate-300 transition hover:text-cyan-400"
          >
            Projects
          </a>

          <a
            href="#experience"
            className="text-sm text-slate-300 transition hover:text-cyan-400"
          >
            Experience
          </a>

          <a
            href="#contact"
            className="text-sm text-slate-300 transition hover:text-cyan-400"
          >
            Contact
          </a>

          <a
            href="#"
            className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Resume
          </a>

        </div>


        {/* ================= MOBILE MENU BUTTON ================= */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg border border-slate-700 p-2 text-slate-200 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

      </div>


      {/* ================= MOBILE MENU ================= */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-5 py-5 md:hidden">

          <div className="flex flex-col gap-4">

            <a
              href="#home"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              Home
            </a>

            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              About
            </a>

            <a
              href="#skills"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              Skills
            </a>

            <a
              href="#projects"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              Projects
            </a>

            <a
              href="#experience"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              Experience
            </a>

            <a
              href="#contact"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 hover:text-cyan-400"
            >
              Contact
            </a>

            <a
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 w-full rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950"
            >
              Resume
            </a>

          </div>

        </div>
      )}

    </nav>
  )
}

export default Navbar