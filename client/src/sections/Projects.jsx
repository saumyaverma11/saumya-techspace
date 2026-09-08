const projects = [
  {
    id: 1,
    title: 'LinkBT',
    description:
      'A URL management platform with custom aliases, link management, tagging and analytics capabilities.',
    technologies: ['React', 'ASP.NET Core', 'SQL Server'],
    category: 'Full Stack',
    github: '#',
    live: '#',
  },
  {
    id: 2,
    title: 'MentorConnect',
    description:
      'A platform designed to connect students and mentors with a focus on communication and collaboration.',
    technologies: ['React', 'Node.js', 'Express.js', 'MongoDB'],
    category: 'MERN',
    github: '#',
    live: '#',
  },
  {
    id: 3,
    title: 'Food Ordering App',
    description:
      'A modern food ordering web application with product browsing, cart management and responsive UI.',
    technologies: ['React', 'JavaScript', 'CSS'],
    category: 'Frontend',
    github: '#',
    live: '#',
  },
]

function Projects() {
  return (
    <section
      id="projects"
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            My work
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Featured Projects
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            A selection of projects I have worked on while learning,
            experimenting and building real-world applications.
          </p>
        </div>


        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {projects.map((project) => (
            <article
              key={project.id}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40"
            >

              {/* Project Image Placeholder */}
              <div className="flex h-48 items-center justify-center bg-slate-800">
                <span className="text-4xl font-bold text-cyan-400/60">
                  {project.title.charAt(0)}
                </span>
              </div>


              {/* Project Content */}
              <div className="p-6">

                <div className="mb-4 flex items-center justify-between gap-3">

                  <h3 className="text-xl font-semibold">
                    {project.title}
                  </h3>

                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                    {project.category}
                  </span>

                </div>


                <p className="min-h-[84px] text-sm leading-6 text-slate-400">
                  {project.description}
                </p>


                {/* Technologies */}
                <div className="mt-5 flex flex-wrap gap-2">

                  {project.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {technology}
                    </span>
                  ))}

                </div>


                {/* Links */}
                <div className="mt-6 flex gap-4">

                  <a
                    href={project.github}
                    className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
                  >
                    GitHub →
                  </a>

                  <a
                    href={project.live}
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                  >
                    Live Demo →
                  </a>

                </div>

              </div>

            </article>
          ))}

        </div>

      </div>
    </section>
  )
}

export default Projects