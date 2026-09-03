import { useState, type FormEvent } from 'react'

import {
  filterTasks,
  type TaskDueDateFilter,
} from './domain/task-filter'
import { sortTasks, type TaskSort } from './domain/task-sort'
import { summarizeTasks } from './domain/task-summary'
import type { TaskPriority, TaskStatus } from './domain/task'
import { emptyWorkspace, type WorkspaceState } from './domain/workspace'

export interface AppProps {
  state?: WorkspaceState
  onCreateProject?: (name: string) => void
  onRenameProject?: (projectId: string, name: string) => void
  onCreateTask?: (projectId: string, title: string) => void
  onDeleteProject?: (projectId: string) => void
  onRenameTask?: (taskId: string, title: string) => void
  onDeleteTask?: (taskId: string) => void
  onChangeTaskStatus?: (taskId: string, status: TaskStatus) => void
  onChangeTaskPriority?: (taskId: string, priority: TaskPriority) => void
  onChangeTaskDueDate?: (taskId: string, dueDate: string | null) => void
  onChangeTaskDescription?: (taskId: string, description: string | null) => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete action'
}

export function App({
  state = emptyWorkspace,
  onCreateProject,
  onRenameProject,
  onCreateTask,
  onDeleteProject,
  onRenameTask,
  onDeleteTask,
  onChangeTaskStatus,
  onChangeTaskPriority,
  onChangeTaskDueDate,
  onChangeTaskDescription,
}: AppProps) {
  const [projectName, setProjectName] = useState('')
  const [projectEdits, setProjectEdits] = useState<Record<string, string>>({})
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({})
  const [taskEdits, setTaskEdits] = useState<Record<string, string>>({})
  const [taskDescriptions, setTaskDescriptions] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [dueDateFilter, setDueDateFilter] = useState<TaskDueDateFilter>('all')
  const [taskSort, setTaskSort] = useState<TaskSort>('created')
  const [projectView, setProjectView] = useState<string>('all')
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

  const workspaceSummary = summarizeTasks(state.tasks)
  const projectLabel = state.projects.length === 1 ? 'project' : 'projects'
  const taskLabel = workspaceSummary.total === 1 ? 'task' : 'tasks'

  const effectiveProjectView =
    projectView === 'all' ||
    state.projects.some((project) => project.id === projectView)
      ? projectView
      : 'all'
  const visibleProjects = state.projects.filter(
    (project) =>
      effectiveProjectView === 'all' || project.id === effectiveProjectView,
  )

  return (
    <main>
      <h1>Workspace</h1>
      <p className="workspace-summary">
        {state.projects.length} {projectLabel} · {workspaceSummary.total}{' '}
        {taskLabel} · {workspaceSummary.done} done
      </p>

      <label htmlFor="project-view">View project</label>
      <select
        id="project-view"
        value={effectiveProjectView}
        onChange={(event) => setProjectView(event.target.value)}
      >
        <option value="all">All projects</option>
        {state.projects.map((project) => {
          const taskCount = state.tasks.filter(
            (task) => task.projectId === project.id,
          ).length

          return (
            <option key={project.id} value={project.id}>
              {project.name} ({taskCount} tasks)
            </option>
          )
        })}
      </select>

      {error ? <p role="alert">{error}</p> : null}

      <label htmlFor="task-search">Search tasks</label>
      <input
        id="task-search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      <label htmlFor="task-status-filter">Filter by status</label>
      <select
        id="task-status-filter"
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value as TaskStatus | 'all')
        }
      >
        <option value="all">All statuses</option>
        <option value="todo">To do</option>
        <option value="doing">Doing</option>
        <option value="done">Done</option>
      </select>

      <label htmlFor="task-priority-filter">Filter by priority</label>
      <select
        id="task-priority-filter"
        value={priorityFilter}
        onChange={(event) =>
          setPriorityFilter(event.target.value as TaskPriority | 'all')
        }
      >
        <option value="all">All priorities</option>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>



      <label htmlFor="task-due-date-filter">Filter by due date</label>
      <select
        id="task-due-date-filter"
        value={dueDateFilter}
        onChange={(event) =>
          setDueDateFilter(event.target.value as TaskDueDateFilter)
        }
      >
        <option value="all">All due dates</option>
        <option value="withDueDate">With due date</option>
        <option value="withoutDueDate">Without due date</option>
      </select>



      <label htmlFor="task-sort">Sort tasks</label>
      <select
        id="task-sort"
        value={taskSort}
        onChange={(event) => setTaskSort(event.target.value as TaskSort)}
      >
        <option value="created">Created</option>
        <option value="title">Title</option>
        <option value="dueDate">Due date</option>
        <option value="priority">Priority</option>
      </select>

      <button
        type="button"
        onClick={() => {
          setSearchQuery('')
          setStatusFilter('all')
          setPriorityFilter('all')
          setDueDateFilter('all')
        }}
      >
        Clear task filters
      </button>

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
        visibleProjects.map((project) => {
          const projectTasks = state.tasks.filter(
            (task) => task.projectId === project.id,
          )
          const tasks = sortTasks(
            filterTasks(projectTasks, {
              query: searchQuery,
              status: statusFilter,
              priority: priorityFilter,
              dueDate: dueDateFilter,
            }),
            taskSort,
          )
          const taskTitle = taskTitles[project.id] ?? ''
          const editedProjectName = projectEdits[project.id] ?? project.name
          const projectSummary = summarizeTasks(projectTasks)

          return (
            <section key={project.id}>
              <h2>{project.name}</h2>
              <p className="project-summary">
                {projectSummary.done} of {projectSummary.total} tasks done
              </p>

              <p className="project-visible-count">
                Showing {tasks.length} of {projectTasks.length} tasks
              </p>

              {onRenameProject ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()

                    try {
                      onRenameProject(project.id, editedProjectName)
                      setProjectEdits((current) => {
                        const next = { ...current }
                        delete next[project.id]
                        return next
                      })
                      setError(null)
                    } catch (caught) {
                      setError(errorMessage(caught))
                    }
                  }}
                >
                  <label htmlFor={`project-edit-${project.id}`}>
                    Name for {project.name}
                  </label>
                  <input
                    id={`project-edit-${project.id}`}
                    value={editedProjectName}
                    onChange={(event) =>
                      setProjectEdits((current) => ({
                        ...current,
                        [project.id]: event.target.value,
                      }))
                    }
                  />
                  <button type="submit">
                    Save project name for {project.name}
                  </button>
                </form>
              ) : null}

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
                <p>{projectTasks.length === 0 ? 'No tasks yet.' : 'No matching tasks.'}</p>
              ) : (
                <ul>
                  {tasks.map((task) => {
                    const editedTitle = taskEdits[task.id] ?? task.title
                    const editedDescription = taskDescriptions[task.id] ?? task.description ?? ''

                    return (
                      <li key={task.id}>
                        <span>{task.title}</span>

                        {onChangeTaskDescription ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault()

                              onChangeTaskDescription(
                                task.id,
                                editedDescription || null,
                              )
                              setTaskDescriptions((current) => {
                                const next = { ...current }
                                delete next[task.id]
                                return next
                              })
                            }}
                          >
                            <label htmlFor={`task-description-${task.id}`}>
                              Description for {task.title}
                            </label>
                            <textarea
                              id={`task-description-${task.id}`}
                              value={editedDescription}
                              onChange={(event) =>
                                setTaskDescriptions((current) => ({
                                  ...current,
                                  [task.id]: event.target.value,
                                }))
                              }
                            />
                            <button type="submit">
                              Save description for {task.title}
                            </button>
                          </form>
                        ) : null}

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



                        {onChangeTaskDueDate ? (
                          <>
                            <label htmlFor={`task-due-date-${task.id}`}>
                              Due date for {task.title}
                            </label>
                            <input
                              id={`task-due-date-${task.id}`}
                              type="date"
                              value={task.dueDate ?? ''}
                              onChange={(event) =>
                                onChangeTaskDueDate(
                                  task.id,
                                  event.target.value || null,
                                )
                              }
                            />
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
