import { useState, type FormEvent } from 'react'

import { emptyWorkspace, type WorkspaceState } from './domain/workspace'

export interface AppProps {
  state?: WorkspaceState
  onCreateProject?: (name: string) => void
  onCreateTask?: (projectId: string, title: string) => void
}

export function App({
  state = emptyWorkspace,
  onCreateProject,
  onCreateTask,
}: AppProps) {
  const [projectName, setProjectName] = useState('')
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({})

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreateProject) {
      return
    }

    onCreateProject(projectName)
    setProjectName('')
  }

  return (
    <main>
      <h1>Workspace</h1>

      {onCreateProject ? (
        <form onSubmit={submitProject}>
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
          <button type="submit">Add project</button>
        </form>
      ) : null}

      {state.projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        state.projects.map((project) => {
          const tasks = state.tasks.filter(
            (task) => task.projectId === project.id,
          )
          const taskTitle = taskTitles[project.id] ?? ''

          return (
            <section key={project.id}>
              <h2>{project.name}</h2>

              {onCreateTask ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    onCreateTask(project.id, taskTitle)
                    setTaskTitles((current) => ({
                      ...current,
                      [project.id]: '',
                    }))
                  }}
                >
                  <label htmlFor={`task-title-${project.id}`}>
                    Task title for {project.name}
                  </label>
                  <input
                    id={`task-title-${project.id}`}
                    value={taskTitle}
                    onChange={(event) =>
                      setTaskTitles((current) => ({
                        ...current,
                        [project.id]: event.target.value,
                      }))
                    }
                  />
                  <button type="submit">Add task</button>
                </form>
              ) : null}

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
