const skills = [
  {
    name: 'React.js',
    category: 'Frontend',
    level: 'Advanced',
  },
  {
    name: 'JavaScript',
    category: 'Frontend',
    level: 'Advanced',
  },
  {
    name: 'HTML',
    category: 'Frontend',
    level: 'Advanced',
  },
  {
    name: 'CSS',
    category: 'Frontend',
    level: 'Advanced',
  },
  {
    name: 'Node.js',
    category: 'Backend',
    level: 'Intermediate',
  },
  {
    name: 'Express.js',
    category: 'Backend',
    level: 'Intermediate',
  },
  {
    name: 'MongoDB',
    category: 'Database',
    level: 'Intermediate',
  },
  {
    name: 'SQL',
    category: 'Database',
    level: 'Intermediate',
  },
  {
    name: 'Git',
    category: 'Tools',
    level: 'Intermediate',
  },
  {
    name: 'ASP.NET Core',
    category: 'Backend',
    level: 'Intermediate',
  },
]


function Skills() {
  return (
    <section
      id="skills"
      className="bg-slate-900 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            What I work with
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Skills & Technologies
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>


        {/* Skills Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {skills.map((skill) => (
            <div
              key={skill.name}
              className="group rounded-2xl border border-white/10 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50"
            >

              <div className="flex items-center justify-between gap-4">

                <div>
                  <h3 className="text-lg font-semibold">
                    {skill.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {skill.category}
                  </p>
                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                  {skill.level}
                </span>

              </div>

              {/* Progress indicator */}
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-cyan-400 ${
                    skill.level === 'Advanced'
                      ? 'w-[85%]'
                      : 'w-[65%]'
                  }`}
                />
              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  )
}

export default Skills