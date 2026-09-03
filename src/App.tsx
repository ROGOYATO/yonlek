import { emptyWorkspace, type WorkspaceState } from './domain/workspace'

export interface AppProps {
  state?: WorkspaceState
}

export function App({ state = emptyWorkspace }: AppProps) {
  return (
    <main>
      <h1>Workspace</h1>

      {state.projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        state.projects.map((project) => {
          const tasks = state.tasks.filter(
            (task) => task.projectId === project.id,
          )

          return (
            <section key={project.id}>
              <h2>{project.name}</h2>
              {tasks.length === 0 ? (
                <p>No tasks yet.</p>
              ) : (
                <ul>
                  {tasks.map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
              )}
            </section>
          )
        })
      )}
    </main>
  )
}
