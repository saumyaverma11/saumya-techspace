import picture from '../assets/Pic.jpeg'

function Hero() {
  return (
   <section
  id="home"
  className="flex min-h-screen items-center bg-slate-950 px-5 pt-24 pb-12 text-white md:px-8 md:pt-20 md:pb-16"
>
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">

        {/* ================= LEFT CONTENT ================= */}
        <div className="text-center md:text-left">

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400 sm:text-sm">
            Welcome to my portfolio
          </p>

          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl xl:text-7xl">
            Hi, I'm{' '}
            <span className="text-cyan-400">
              Saumya Verma
            </span>
          </h1>

          <h2 className="mx-auto mt-5 max-w-2xl text-xl font-semibold leading-snug text-slate-200 sm:text-2xl lg:mx-0 lg:text-3xl">
            Junior Software Engineer | Full-Stack Developer
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base lg:mx-0 lg:text-lg">
            I build modern, scalable and user-friendly web applications
            using modern frontend and backend technologies.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">

            <a
              href="#projects"
              className="w-full rounded-full bg-cyan-400 px-7 py-3 text-center font-semibold text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-cyan-300 sm:w-auto"
            >
              View My Work
            </a>

            <a
              href="#contact"
              className="w-full rounded-full border border-slate-600 px-7 py-3 text-center font-semibold text-white transition duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:text-cyan-400 sm:w-auto"
            >
              Contact Me
            </a>

          </div>

          {/* Social Links */}
          <div className="mt-7 flex justify-center gap-6 text-sm text-slate-400 lg:justify-start">

            <a
              href="#"
              className="transition hover:text-cyan-400"
            >
              GitHub
            </a>

            <a
              href="#"
              className="transition hover:text-cyan-400"
            >
              LinkedIn
            </a>

            <a
              href="mailto:yourmail@example.com"
              className="transition hover:text-cyan-400"
            >
              Email
            </a>

          </div>

        </div>


        {/* ================= RIGHT PROFILE ================= */}
        <div className="flex justify-center">

          <div
            className="
              w-full max-w-[300px]
              rounded-3xl
              border border-slate-700
              bg-slate-900
              px-6 py-8
              text-center
              shadow-xl
              sm:max-w-[340px]
              sm:px-8 sm:py-10
              md:max-w-[360px]
            "
          >

            {/* Profile Image */}
            <div className="mx-auto mb-6 h-52 w-52 overflow-hidden rounded-full border-2 border-cyan-400 sm:h-60 sm:w-60">

              <img
                src={picture}
                alt="Saumya Verma"
                className="h-full w-full object-cover"
              />

            </div>

            {/* Name */}
            <h3 className="text-xl font-semibold text-white">
              Saumya Verma
            </h3>

            {/* Role */}
            <p className="mt-2 text-sm text-slate-400">
              Junior Software Engineer
            </p>

            {/* Small divider */}
            <div className="mx-auto mt-6 h-px w-16 bg-cyan-400/50" />

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Full-Stack Developer passionate about building
              modern web applications.
            </p>

          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero