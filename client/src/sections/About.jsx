function About() {
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

        {/* Content */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">

          {/* Left */}
          <div>
            <h3 className="text-2xl font-semibold sm:text-3xl">
              Building ideas into{" "}
              <span className="text-cyan-400">
                real applications.
              </span>
            </h3>

            <p className="mt-6 leading-7 text-slate-400">
              I'm a Junior Software Engineer and Full-Stack Developer
              passionate about building modern, scalable and user-friendly
              web applications.
            </p>

            <p className="mt-4 leading-7 text-slate-400">
              I enjoy working across the frontend and backend, solving
              problems with clean code and continuously learning new
              technologies.
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
              <h4 className="text-3xl font-bold text-cyan-400">
                10+
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Projects Built
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">
                2+
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Years Learning
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">
                10+
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Technologies
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h4 className="text-3xl font-bold text-cyan-400">
                ∞
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Curiosity to Learn
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

export default About