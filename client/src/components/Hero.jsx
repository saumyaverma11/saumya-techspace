import picture from '../assets/Pic.jpeg';

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
  const email = profile?.email ? `mailto:${profile.email}` : 'mailto:yourmail@example.com';

  return (
    <section
      id="home"
      className="flex min-h-screen items-center bg-slate-950 px-5 pt-24 pb-12 text-white md:px-8 md:pt-20 md:pb-16"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* ================= LEFT CONTENT ================= */}
        <div className="text-center md:text-left">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400 sm:text-sm">
            {tagline}
          </p>

          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl xl:text-7xl">
            Hi, I'm <span className="text-cyan-400">{name}</span>
          </h1>

          <h2 className="mx-auto mt-5 max-w-2xl text-xl font-semibold leading-snug text-slate-200 sm:text-2xl lg:mx-0 lg:text-3xl">
            {title}
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base lg:mx-0 lg:text-lg">
            {bio}
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
              href={githubUrl}
              target={githubUrl !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className="transition hover:text-cyan-400"
            >
              GitHub
            </a>

            <a
              href={linkedinUrl}
              target={linkedinUrl !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className="transition hover:text-cyan-400"
            >
              LinkedIn
            </a>

            <a href={email} className="transition hover:text-cyan-400">
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
                src={avatar}
                alt={name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // If custom avatar URL fails to load, fallback to local picture
                  if (e.currentTarget.src !== picture) {
                    e.currentTarget.src = picture;
                  }
                }}
              />
            </div>

            {/* Name */}
            <h3 className="text-xl font-semibold text-white">{name}</h3>

            {/* Role */}
            <p className="mt-2 text-sm text-slate-400">{title.split('|')[0].trim()}</p>

            {/* Small divider */}
            <div className="mx-auto mt-6 h-px w-16 bg-cyan-400/50" />

            <p className="mt-4 text-xs leading-5 text-slate-500">
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