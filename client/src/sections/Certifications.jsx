const certifications = [
  {
    title: 'JavaScript Certification',
    issuer: 'Great Learning',
    year: '2025',
    credential: '#',
  },
  {
    title: 'HTML Certification',
    issuer: 'Great Learning',
    year: '2025',
    credential: '#',
  },
  {
    title: 'CSS Certification',
    issuer: 'Great Learning',
    year: '2025',
    credential: '#',
  },
  {
    title: 'Python Certification',
    issuer: 'HackerRank',
    year: '2025',
    credential: '#',
  },
]

function Certifications() {
  return (
    <section
      id="certifications"
      className="bg-slate-900 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Credentials
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Certifications
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Certification Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {certifications.map((certification) => (
            <article
              key={`${certification.title}-${certification.issuer}`}
              className="group rounded-2xl border border-white/10 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
            >

              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-400">
                ✓
              </div>

              <h3 className="text-lg font-semibold">
                {certification.title}
              </h3>

              <p className="mt-2 text-sm text-cyan-400">
                {certification.issuer}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {certification.year}
              </p>

              <a
                href={certification.credential}
                className="mt-5 inline-block text-sm text-slate-300 transition hover:text-cyan-400"
              >
                View Credential →
              </a>

            </article>
          ))}

        </div>

      </div>
    </section>
  )
}

export default Certifications