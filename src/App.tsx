import { useState, type FormEvent } from 'react'

import type { TaskPriority, TaskStatus } from './domain/task'
import { emptyWorkspace, type WorkspaceState } from './domain/workspace'

export interface AppProps {
  state?: WorkspaceState
  onCreateProject?: (name: string) => void
  onCreateTask?: (projectId: string, title: string) => void
  onDeleteProject?: (projectId: string) => void
  onRenameTask?: (taskId: string, title: string) => void
  onDeleteTask?: (taskId: string) => void
  onChangeTaskStatus?: (taskId: string, status: TaskStatus) => void
  onChangeTaskPriority?: (taskId: string, priority: TaskPriority) => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete action'
}

export function App({
  state = emptyWorkspace,
  onCreateProject,
  onCreateTask,
  onDeleteProject,
  onRenameTask,
  onDeleteTask,
  onChangeTaskStatus,
  onChangeTaskPriority,
}: AppProps) {
  const [projectName, setProjectName] = useState('')
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({})
  const [taskEdits, setTaskEdits] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreateProject) {
      return
    }

    try {
      onCreateProject(projectName)
      setProjectName('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <main>
      <h1>Workspace</h1>

      {error ? <p role="alert">{error}</p> : null}

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

              {onDeleteProject ? (
                <button
                  type="button"
                  onClick={() => onDeleteProject(project.id)}
                >
                  Delete project {project.name}
                </button>
              ) : null}

              {onCreateTask ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()

                    try {
                      onCreateTask(project.id, taskTitle)
                      setTaskTitles((current) => ({
                        ...current,
                        [project.id]: '',
                      }))
                      setError(null)
                    } catch (caught) {
                      setError(errorMessage(caught))
                    }
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
                  {tasks.map((task) => {
                    const editedTitle = taskEdits[task.id] ?? task.title

                    return (
                      <li key={task.id}>
                        <span>{task.title}</span>

                        {onRenameTask ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault()

                              try {
                                onRenameTask(task.id, editedTitle)
                                setTaskEdits((current) => {
                                  const next = { ...current }
                                  delete next[task.id]
                                  return next
                                })
                                setError(null)
                              } catch (caught) {
                                setError(errorMessage(caught))
                              }
                            }}
                          >
                            <label htmlFor={`task-edit-${task.id}`}>
                              Title for {task.title}
                            </label>
                            <input
                              id={`task-edit-${task.id}`}
                              value={editedTitle}
                              onChange={(event) =>
                                setTaskEdits((current) => ({
                                  ...current,
                                  [task.id]: event.target.value,
                                }))
                              }
                            />
                            <button type="submit">
                              Save title for {task.title}
                            </button>
                          </form>
                        ) : null}

                        {onChangeTaskStatus ? (
                          <>
                            <label htmlFor={`task-status-${task.id}`}>
                              Status for {task.title}
                            </label>
                            <select
                              id={`task-status-${task.id}`}
                              value={task.status}
                              onChange={(event) =>
                                onChangeTaskStatus(
                                  task.id,
                                  event.target.value as TaskStatus,
                                )
                              }
                            >
                              <option value="todo">To do</option>
                              <option value="doing">Doing</option>
                              <option value="done">Done</option>
                            </select>
                          </>
                        ) : null}

                        {onChangeTaskPriority ? (
                          <>
                            <label htmlFor={`task-priority-${task.id}`}>
                              Priority for {task.title}
                            </label>
                            <select
                              id={`task-priority-${task.id}`}
                              value={task.priority}
                              onChange={(event) =>
                                onChangeTaskPriority(
                                  task.id,
                                  event.target.value as TaskPriority,
                                )
                              }
                            >
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                            </select>
                          </>
                        ) : null}

                        {onDeleteTask ? (
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                          >
                            Delete task {task.title}
                          </button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })
      )}
    </main>
  )
}
