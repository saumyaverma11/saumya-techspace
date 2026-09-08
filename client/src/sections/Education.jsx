const education = [
  {
    degree: 'Master of Computer Applications',
    institution: 'GL Bajaj Institute of Technology and Management',
    duration: '2024 - 2026',
    description:
      'Focused on software development, programming, databases, web technologies and application development.',
  },
  {
    degree: 'Bachelor of Computer Applications',
    institution: 'SSPG College',
    duration: '2021 - 2024',
    description:
      'Built a strong foundation in programming, computer science fundamentals and web development.',
  },
]

function Education() {
  return (
    <section
      id="education"
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-5xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Academic background
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Education
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Education Cards */}
        <div className="space-y-6">

          {education.map((item) => (
            <article
              key={`${item.degree}-${item.institution}`}
              className="rounded-2xl border border-white/10 bg-slate-900 p-6 transition duration-300 hover:border-cyan-400/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <h3 className="text-xl font-semibold">
                    {item.degree}
                  </h3>

                  <p className="mt-2 text-cyan-400">
                    {item.institution}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                  {item.duration}
                </span>

              </div>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                {item.description}
              </p>
            </article>
          ))}

        </div>

      </div>
    </section>
  )
}

export default Education