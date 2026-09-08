const experiences = [
  {
    role: 'Junior Software Engineer',
    company: 'Intellisoft Technology',
    duration: '2026 - Present',
    description:
      'Working on modern web applications and contributing to frontend and backend development using React, ASP.NET Core and database technologies.',
    technologies: ['React', 'ASP.NET Core', 'C#', 'SQL'],
  },
]



function Experience() {
  return (
    <section
      id="experience"
      className="bg-slate-900 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-5xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            My journey
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Experience
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Timeline */}
        <div className="relative">

          {/* Vertical Line */}
          <div className="absolute left-3 top-0 h-full w-px bg-slate-700 md:left-1/2 md:-translate-x-1/2" />

          {experiences.map((experience, index) => (
            <div
              key={`${experience.company}-${index}`}
              className="relative mb-10 pl-10 md:grid md:grid-cols-2 md:gap-12 md:pl-0"
            >

              {/* Timeline Dot */}
              <div className="absolute left-0 top-1 h-7 w-7 rounded-full border-4 border-slate-900 bg-cyan-400 md:left-1/2 md:-translate-x-1/2" />

              {/* Content */}
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 md:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <h3 className="text-xl font-semibold">
                      {experience.role}
                    </h3>

                    <p className="mt-1 text-cyan-400">
                      {experience.company}
                    </p>
                  </div>

                  <span className="text-sm text-slate-500">
                    {experience.duration}
                  </span>

                </div>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  {experience.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {experience.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {technology}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  )
}

export default Experience