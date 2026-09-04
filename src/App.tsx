import { useState, type FormEvent } from 'react'

import {
  filterTasks,
  type TaskDueDateFilter,
} from './domain/task-filter'
import { sortTasks, type TaskSort } from './domain/task-sort'
import { summarizeTasks } from './domain/task-summary'
import type { MoveDirection } from './domain/manual-order'
import type { TaskRelationshipType } from './domain/task-relationship'
import {
  createDefaultViewPreferences,
  updateViewPreferences,
  type ViewPreferences,
} from './domain/view-preferences'
import type { TaskPriority, TaskStatus } from './domain/task'
import type {
  CustomFieldType,
  CustomFieldValue,
} from './domain/custom-field'
import { emptyWorkspace, type WorkspaceState } from './domain/workspace'

export interface AppProps {
  state?: WorkspaceState
  onCreateTaskRelationship?: (type: TaskRelationshipType, sourceTaskId: string, targetTaskId: string) => void
  onDeleteTaskRelationship?: (relationshipId: string) => void
  onCreateCustomField?: (name: string, type: CustomFieldType) => void
  onRenameCustomField?: (fieldId: string, name: string) => void
  onDeleteCustomField?: (fieldId: string) => void
  onChangeTaskCustomFieldValue?: (taskId: string, fieldId: string, value: CustomFieldValue | null) => void
  onCreatePerson?: (name: string) => void
  onRenamePerson?: (personId: string, name: string) => void
  onDeletePerson?: (personId: string) => void
  onChangeTaskAssignee?: (taskId: string, personId: string, assigned: boolean) => void
  onCreateTag?: (name: string) => void
  onRenameTag?: (tagId: string, name: string) => void
  onDeleteTag?: (tagId: string) => void
  onChangeTaskTag?: (taskId: string, tagId: string, assigned: boolean) => void
  onCreateArea?: (name: string) => void
  onRenameArea?: (areaId: string, name: string) => void
  onDeleteArea?: (areaId: string) => void
  onMoveArea?: (areaId: string, direction: MoveDirection) => void
  onChangeProjectArea?: (projectId: string, areaId: string | null) => void
  onCreateTaskList?: (projectId: string, name: string) => void
  onRenameTaskList?: (listId: string, name: string) => void
  onDeleteTaskList?: (listId: string) => void
  onMoveTaskList?: (listId: string, direction: MoveDirection) => void
  onChangeTaskList?: (taskId: string, listId: string | null) => void
  onAddChecklistItem?: (taskId: string, text: string) => void
  onRenameChecklistItem?: (taskId: string, itemId: string, text: string) => void
  onChangeChecklistItemCompleted?: (taskId: string, itemId: string, completed: boolean) => void
  onDeleteChecklistItem?: (taskId: string, itemId: string) => void
  onMoveChecklistItem?: (taskId: string, itemId: string, direction: MoveDirection) => void
  onMoveProject?: (projectId: string, direction: MoveDirection) => void
  onCreateProject?: (name: string) => void
  onSaveProjectTemplate?: (projectId: string, name: string) => void
  onCreateProjectFromTemplate?: (templateId: string) => void
  onDeleteProjectTemplate?: (templateId: string) => void
  onSaveTaskTemplate?: (taskId: string, name: string) => void
  onCreateTaskFromTemplate?: (templateId: string, projectId: string, listId?: string) => void
  onDeleteTaskTemplate?: (templateId: string) => void
  onArchiveProject?: (projectId: string) => void
  onRestoreProject?: (projectId: string) => void
  onRenameProject?: (projectId: string, name: string) => void
  onChangeProjectDescription?: (projectId: string, description: string | null) => void
  onCreateTask?: (projectId: string, title: string, listId?: string) => void
  onCreateSubtask?: (parentTaskId: string, title: string) => void
  onDuplicateTask?: (taskId: string) => void
  onArchiveTask?: (taskId: string) => void
  onRestoreTask?: (taskId: string) => void
  onDeleteProject?: (projectId: string) => void
  onRenameTask?: (taskId: string, title: string) => void
  onDeleteTask?: (taskId: string) => void
  onMoveTask?: (taskId: string, direction: MoveDirection) => void
  onChangeTaskStatus?: (taskId: string, status: TaskStatus) => void
  onChangeTaskPriority?: (taskId: string, priority: TaskPriority) => void
  onChangeTaskDueDate?: (taskId: string, dueDate: string | null) => void
  onChangeTaskDescription?: (taskId: string, description: string | null) => void
  onChangeTaskProject?: (taskId: string, projectId: string) => void
  initialViewPreferences?: ViewPreferences
  onViewPreferencesChange?: (preferences: ViewPreferences) => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete action'
}

export function App({
  state = emptyWorkspace,
  onCreateTaskRelationship,
  onDeleteTaskRelationship,
  onCreateCustomField,
  onRenameCustomField,
  onDeleteCustomField,
  onChangeTaskCustomFieldValue,
  onCreatePerson,
  onRenamePerson,
  onDeletePerson,
  onChangeTaskAssignee,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
  onChangeTaskTag,
  onCreateArea,
  onRenameArea,
  onDeleteArea,
  onMoveArea,
  onChangeProjectArea,
  onCreateTaskList,
  onRenameTaskList,
  onDeleteTaskList,
  onMoveTaskList,
  onChangeTaskList,
  onAddChecklistItem,
  onRenameChecklistItem,
  onChangeChecklistItemCompleted,
  onDeleteChecklistItem,
  onMoveChecklistItem,
  onMoveProject,
  onCreateProject,
  onSaveProjectTemplate,
  onCreateProjectFromTemplate,
  onDeleteProjectTemplate,
  onSaveTaskTemplate,
  onCreateTaskFromTemplate,
  onDeleteTaskTemplate,
  onArchiveProject,
  onRestoreProject,
  onRenameProject,
  onChangeProjectDescription,
  onCreateTask,
  onCreateSubtask,
  onDuplicateTask,
  onArchiveTask,
  onRestoreTask,
  onDeleteProject,
  onRenameTask,
  onDeleteTask,
  onMoveTask,
  onChangeTaskStatus,
  onChangeTaskPriority,
  onChangeTaskDueDate,
  onChangeTaskDescription,
  onChangeTaskProject,
  initialViewPreferences = createDefaultViewPreferences(),
  onViewPreferencesChange,
}: AppProps) {
  const [relationshipTypes, setRelationshipTypes] = useState<
    Record<string, TaskRelationshipType>
  >({})
  const [relationshipTargets, setRelationshipTargets] = useState<
    Record<string, string>
  >({})
  const [customFieldName, setCustomFieldName] = useState('')
  const [customFieldType, setCustomFieldType] = useState<CustomFieldType>('text')
  const [customFieldEdits, setCustomFieldEdits] = useState<Record<string, string>>({})
  const [customFieldValueDrafts, setCustomFieldValueDrafts] = useState<
    Record<string, string>
  >({})
  const [personName, setPersonName] = useState('')
  const [personEdits, setPersonEdits] = useState<Record<string, string>>({})
  const [tagName, setTagName] = useState('')
  const [tagEdits, setTagEdits] = useState<Record<string, string>>({})
  const [areaName, setAreaName] = useState('')
  const [areaEdits, setAreaEdits] = useState<Record<string, string>>({})
  const [listNames, setListNames] = useState<Record<string, string>>({})
  const [listEdits, setListEdits] = useState<Record<string, string>>({})
  const [projectName, setProjectName] = useState('')
  const [projectEdits, setProjectEdits] = useState<Record<string, string>>({})
  const [projectDescriptions, setProjectDescriptions] = useState<Record<string, string>>({})
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({})
  const [newTaskLists, setNewTaskLists] = useState<Record<string, string>>({})
  const [subtaskTitles, setSubtaskTitles] = useState<Record<string, string>>({})
  const [checklistTexts, setChecklistTexts] = useState<Record<string, string>>({})
  const [checklistEdits, setChecklistEdits] = useState<Record<string, string>>({})
  const [taskEdits, setTaskEdits] = useState<Record<string, string>>({})
  const [taskDescriptions, setTaskDescriptions] = useState<Record<string, string>>({})
  const [taskTemplateProjects, setTaskTemplateProjects] = useState<Record<string, string>>({})
  const [taskTemplateLists, setTaskTemplateLists] = useState<Record<string, string>>({})
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(
    initialViewPreferences,
  )
  const {
    projectView,
    query: searchQuery,
    status: statusFilter,
    priority: priorityFilter,
    dueDate: dueDateFilter,
    sort: taskSort,
  } = viewPreferences

  function updatePreferences(patch: Partial<ViewPreferences>) {
    setViewPreferences((current) => {
      const next = updateViewPreferences(current, patch)
      onViewPreferencesChange?.(next)
      return next
    })
  }
  const [error, setError] = useState<string | null>(null)

  function submitCustomField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreateCustomField) {
      return
    }

    try {
      onCreateCustomField(customFieldName, customFieldType)
      setCustomFieldName('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  function submitPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreatePerson) {
      return
    }

    try {
      onCreatePerson(personName)
      setPersonName('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  function submitTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreateTag) {
      return
    }

    try {
      onCreateTag(tagName)
      setTagName('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  function submitArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onCreateArea) {
      return
    }

    try {
      onCreateArea(areaName)
      setAreaName('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

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

  const relationships = state.relationships ?? []
  const customFields = state.customFields ?? []
  const people = state.people ?? []
  const tags = state.tags ?? []
  const areas = state.areas ?? []
  const lists = state.lists ?? []
  const projectTemplates = state.projectTemplates ?? []
  const taskTemplates = state.taskTemplates ?? []
  const activeProjects = state.projects.filter(
    (project) => project.archivedAt === undefined,
  )
  const archivedProjects = state.projects.filter(
    (project) => project.archivedAt !== undefined,
  )
  const activeProjectIds = new Set(
    activeProjects.map((project) => project.id),
  )
  const activeTasks = state.tasks.filter(
    (task) =>
      task.archivedAt === undefined &&
      activeProjectIds.has(task.projectId),
  )
  const archivedTasks = state.tasks.filter(
    (task) =>
      task.archivedAt !== undefined &&
      activeProjectIds.has(task.projectId),
  )
  const archivedTaskRoots = archivedTasks.filter((task) => {
    if (task.parentTaskId === undefined) {
      return true
    }

    const parent = state.tasks.find(
      (candidate) => candidate.id === task.parentTaskId,
    )
    return parent?.archivedAt === undefined
  })
  const workspaceSummary = summarizeTasks(activeTasks)
  const projectLabel = activeProjects.length === 1 ? 'project' : 'projects'
  const taskLabel = workspaceSummary.total === 1 ? 'task' : 'tasks'

  const effectiveProjectView =
    projectView === 'all' ||
    activeProjects.some((project) => project.id === projectView)
      ? projectView
      : 'all'
  const visibleProjects = activeProjects.filter(
    (project) =>
      effectiveProjectView === 'all' || project.id === effectiveProjectView,
  )

  return (
    <main>
      <h1>Yönlek</h1>
      <p className="workspace-summary">
        {activeProjects.length} {projectLabel} · {workspaceSummary.total}{' '}
        {taskLabel} · {workspaceSummary.done} done
      </p>

      <label htmlFor="project-view">View project</label>
      <select
        id="project-view"
        value={effectiveProjectView}
        onChange={(event) => updatePreferences({ projectView: event.target.value })}
      >
        <option value="all">All projects</option>
        {activeProjects.map((project) => {
          const taskCount = activeTasks.filter(
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
        onChange={(event) => updatePreferences({ query: event.target.value })}
      />

      <label htmlFor="task-status-filter">Filter by status</label>
      <select
        id="task-status-filter"
        value={statusFilter}
        onChange={(event) =>
          updatePreferences({
            status: event.target.value as TaskStatus | 'all',
          })
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
          updatePreferences({
            priority: event.target.value as TaskPriority | 'all',
          })
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
          updatePreferences({
            dueDate: event.target.value as TaskDueDateFilter,
          })
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
        onChange={(event) =>
          updatePreferences({ sort: event.target.value as TaskSort })
        }
      >
        <option value="created">Created</option>
        <option value="title">Title</option>
        <option value="dueDate">Due date</option>
        <option value="priority">Priority</option>
        <option value="manual">Manual</option>
      </select>

      <button
        type="button"
        onClick={() => {
          updatePreferences({
            query: '',
            status: 'all',
            priority: 'all',
            dueDate: 'all',
          })
        }}
      >
        Clear task filters
      </button>

      {onCreateArea ? (
        <section>
          <h2>Areas</h2>
          <form onSubmit={submitArea}>
            <label htmlFor="area-name">Area name</label>
            <input
              id="area-name"
              value={areaName}
              onChange={(event) => setAreaName(event.target.value)}
            />
            <button type="submit">Add area</button>
          </form>

          {areas.length === 0 ? (
            <p>No areas yet.</p>
          ) : (
            <ul>
              {areas.map((area) => {
                const editedAreaName = areaEdits[area.id] ?? area.name

                return (
                  <li key={area.id}>
                    <span>
                      {area.name} (
                      {
                        activeProjects.filter(
                          (project) => project.areaId === area.id,
                        ).length
                      }{' '}
                      {
                        activeProjects.filter(
                          (project) => project.areaId === area.id,
                        ).length === 1
                          ? 'project'
                          : 'projects'
                      }
                      )
                    </span>
                    {onMoveArea ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onMoveArea(area.id, 'up')}
                        >
                          Move area {area.name} up
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveArea(area.id, 'down')}
                        >
                          Move area {area.name} down
                        </button>
                      </>
                    ) : null}
                    {onRenameArea ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()

                          try {
                            onRenameArea(area.id, editedAreaName)
                            setAreaEdits((current) => {
                              const next = { ...current }
                              delete next[area.id]
                              return next
                            })
                            setError(null)
                          } catch (caught) {
                            setError(errorMessage(caught))
                          }
                        }}
                      >
                        <label htmlFor={`area-edit-${area.id}`}>
                          Name for area {area.name}
                        </label>
                        <input
                          id={`area-edit-${area.id}`}
                          value={editedAreaName}
                          onChange={(event) =>
                            setAreaEdits((current) => ({
                              ...current,
                              [area.id]: event.target.value,
                            }))
                          }
                        />
                        <button type="submit">
                          Save area name for {area.name}
                        </button>
                      </form>
                    ) : null}
                    {onDeleteArea ? (
                      <button
                        type="button"
                        onClick={() => onDeleteArea(area.id)}
                      >
                        Delete area {area.name}
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {onCreateCustomField ? (
        <section>
          <h2>Custom fields</h2>
          <form onSubmit={submitCustomField}>
            <label htmlFor="custom-field-name">Custom field name</label>
            <input
              id="custom-field-name"
              value={customFieldName}
              onChange={(event) =>
                setCustomFieldName(event.target.value)
              }
            />
            <label htmlFor="custom-field-type">Custom field type</label>
            <select
              id="custom-field-type"
              value={customFieldType}
              onChange={(event) =>
                setCustomFieldType(
                  event.target.value as CustomFieldType,
                )
              }
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <button type="submit">Add custom field</button>
          </form>

          {customFields.length === 0 ? (
            <p>No custom fields yet.</p>
          ) : (
            <ul>
              {customFields.map((field) => {
                const editedName =
                  customFieldEdits[field.id] ?? field.name

                return (
                  <li key={field.id}>
                    <span>
                      {field.name} ({field.type})
                    </span>
                    {onRenameCustomField ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()

                          try {
                            onRenameCustomField(field.id, editedName)
                            setCustomFieldEdits((current) => {
                              const next = { ...current }
                              delete next[field.id]
                              return next
                            })
                            setError(null)
                          } catch (caught) {
                            setError(errorMessage(caught))
                          }
                        }}
                      >
                        <label htmlFor={`custom-field-edit-${field.id}`}>
                          Name for custom field {field.name}
                        </label>
                        <input
                          id={`custom-field-edit-${field.id}`}
                          value={editedName}
                          onChange={(event) =>
                            setCustomFieldEdits((current) => ({
                              ...current,
                              [field.id]: event.target.value,
                            }))
                          }
                        />
                        <button type="submit">
                          Save custom field name for {field.name}
                        </button>
                      </form>
                    ) : null}
                    {onDeleteCustomField ? (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomField(field.id)}
                      >
                        Delete custom field {field.name}
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {onCreatePerson ? (
        <section>
          <h2>People</h2>
          <form onSubmit={submitPerson}>
            <label htmlFor="person-name">Person name</label>
            <input
              id="person-name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
            />
            <button type="submit">Add person</button>
          </form>

          {people.length === 0 ? (
            <p>No people yet.</p>
          ) : (
            <ul>
              {people.map((person) => {
                const editedPersonName =
                  personEdits[person.id] ?? person.name

                return (
                  <li key={person.id}>
                    <span>{person.name}</span>
                    {onRenamePerson ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()

                          try {
                            onRenamePerson(person.id, editedPersonName)
                            setPersonEdits((current) => {
                              const next = { ...current }
                              delete next[person.id]
                              return next
                            })
                            setError(null)
                          } catch (caught) {
                            setError(errorMessage(caught))
                          }
                        }}
                      >
                        <label htmlFor={`person-edit-${person.id}`}>
                          Name for person {person.name}
                        </label>
                        <input
                          id={`person-edit-${person.id}`}
                          value={editedPersonName}
                          onChange={(event) =>
                            setPersonEdits((current) => ({
                              ...current,
                              [person.id]: event.target.value,
                            }))
                          }
                        />
                        <button type="submit">
                          Save person name for {person.name}
                        </button>
                      </form>
                    ) : null}
                    {onDeletePerson ? (
                      <button
                        type="button"
                        onClick={() => onDeletePerson(person.id)}
                      >
                        Delete person {person.name}
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {onCreateTag ? (
        <section>
          <h2>Tags</h2>
          <form onSubmit={submitTag}>
            <label htmlFor="tag-name">Tag name</label>
            <input
              id="tag-name"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
            />
            <button type="submit">Add tag</button>
          </form>

          {tags.length === 0 ? (
            <p>No tags yet.</p>
          ) : (
            <ul>
              {tags.map((tag) => {
                const editedTagName = tagEdits[tag.id] ?? tag.name

                return (
                  <li key={tag.id}>
                    <span>{tag.name}</span>
                    {onRenameTag ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()

                          try {
                            onRenameTag(tag.id, editedTagName)
                            setTagEdits((current) => {
                              const next = { ...current }
                              delete next[tag.id]
                              return next
                            })
                            setError(null)
                          } catch (caught) {
                            setError(errorMessage(caught))
                          }
                        }}
                      >
                        <label htmlFor={`tag-edit-${tag.id}`}>
                          Name for tag {tag.name}
                        </label>
                        <input
                          id={`tag-edit-${tag.id}`}
                          value={editedTagName}
                          onChange={(event) =>
                            setTagEdits((current) => ({
                              ...current,
                              [tag.id]: event.target.value,
                            }))
                          }
                        />
                        <button type="submit">
                          Save tag name for {tag.name}
                        </button>
                      </form>
                    ) : null}
                    {onDeleteTag ? (
                      <button
                        type="button"
                        onClick={() => onDeleteTag(tag.id)}
                      >
                        Delete tag {tag.name}
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

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

      {activeProjects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        visibleProjects.map((project) => {
          const projectLists = lists.filter(
            (list) => list.projectId === project.id,
          )
          const projectTasks = activeTasks.filter(
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
          const listName = listNames[project.id] ?? ''
          const taskTitle = taskTitles[project.id] ?? ''
          const newTaskListId = newTaskLists[project.id] ?? ''
          const editedProjectName = projectEdits[project.id] ?? project.name
          const editedProjectDescription =
            projectDescriptions[project.id] ?? project.description ?? ''
          const projectSummary = summarizeTasks(projectTasks)

          return (
            <section key={project.id}>
              <h2>{project.name}</h2>
              {onMoveProject ? (
                <>
                  <button
                    type="button"
                    onClick={() => onMoveProject(project.id, 'up')}
                  >
                    Move project {project.name} up
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveProject(project.id, 'down')}
                  >
                    Move project {project.name} down
                  </button>
                </>
              ) : null}
              <p className="project-summary">
                {projectSummary.done} of {projectSummary.total} tasks done
              </p>

              <p className="project-visible-count">
                Showing {tasks.length} of {projectTasks.length} tasks
              </p>

              {onChangeProjectArea ? (
                <>
                  <label htmlFor={`project-area-${project.id}`}>
                    Area for {project.name}
                  </label>
                  <select
                    id={`project-area-${project.id}`}
                    value={project.areaId ?? ''}
                    onChange={(event) =>
                      onChangeProjectArea(
                        project.id,
                        event.target.value || null,
                      )
                    }
                  >
                    <option value="">No area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}

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

              {onChangeProjectDescription ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()

                    onChangeProjectDescription(
                      project.id,
                      editedProjectDescription || null,
                    )
                    setProjectDescriptions((current) => {
                      const next = { ...current }
                      delete next[project.id]
                      return next
                    })
                  }}
                >
                  <label htmlFor={`project-description-${project.id}`}>
                    Description for {project.name}
                  </label>
                  <textarea
                    id={`project-description-${project.id}`}
                    value={editedProjectDescription}
                    onChange={(event) =>
                      setProjectDescriptions((current) => ({
                        ...current,
                        [project.id]: event.target.value,
                      }))
                    }
                  />
                  <button type="submit">
                    Save project description for {project.name}
                  </button>
                </form>
              ) : null}

              {onCreateTaskList ? (
                <section>
                  <h3>Lists for {project.name}</h3>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()

                      try {
                        onCreateTaskList(project.id, listName)
                        setListNames((current) => ({
                          ...current,
                          [project.id]: '',
                        }))
                        setError(null)
                      } catch (caught) {
                        setError(errorMessage(caught))
                      }
                    }}
                  >
                    <label htmlFor={`list-name-${project.id}`}>
                      List name for {project.name}
                    </label>
                    <input
                      id={`list-name-${project.id}`}
                      value={listName}
                      onChange={(event) =>
                        setListNames((current) => ({
                          ...current,
                          [project.id]: event.target.value,
                        }))
                      }
                    />
                    <button type="submit">
                      Add list to {project.name}
                    </button>
                  </form>

                  {projectLists.length === 0 ? (
                    <p>No lists yet.</p>
                  ) : (
                    <ul>
                      {projectLists.map((list) => {
                        const editedName = listEdits[list.id] ?? list.name

                        return (
                          <li key={list.id}>
                            <span>
                              {list.name} (
                              {
                                projectTasks.filter(
                                  (task) => task.listId === list.id,
                                ).length
                              }{' '}
                              {
                                projectTasks.filter(
                                  (task) => task.listId === list.id,
                                ).length === 1
                                  ? 'task'
                                  : 'tasks'
                              }
                              )
                            </span>
                            {onMoveTaskList ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onMoveTaskList(list.id, 'up')
                                  }
                                >
                                  Move list {list.name} up
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onMoveTaskList(list.id, 'down')
                                  }
                                >
                                  Move list {list.name} down
                                </button>
                              </>
                            ) : null}
                            {onRenameTaskList ? (
                              <form
                                onSubmit={(event) => {
                                  event.preventDefault()
                                  onRenameTaskList(list.id, editedName)
                                  setListEdits((current) => {
                                    const next = { ...current }
                                    delete next[list.id]
                                    return next
                                  })
                                }}
                              >
                                <label htmlFor={`list-edit-${list.id}`}>
                                  Name for list {list.name}
                                </label>
                                <input
                                  id={`list-edit-${list.id}`}
                                  value={editedName}
                                  onChange={(event) =>
                                    setListEdits((current) => ({
                                      ...current,
                                      [list.id]: event.target.value,
                                    }))
                                  }
                                />
                                <button type="submit">
                                  Save list name for {list.name}
                                </button>
                              </form>
                            ) : null}
                            {onDeleteTaskList ? (
                              <button
                                type="button"
                                onClick={() => onDeleteTaskList(list.id)}
                              >
                                Delete list {list.name}
                              </button>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              ) : null}

              {onSaveProjectTemplate ? (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      onSaveProjectTemplate(project.id, project.name)
                      setError(null)
                    } catch (caught) {
                      setError(errorMessage(caught))
                    }
                  }}
                >
                  Save project as template {project.name}
                </button>
              ) : null}

              {onArchiveProject ? (
                <button
                  type="button"
                  onClick={() => {
                    if (effectiveProjectView === project.id) {
                      updatePreferences({ projectView: 'all' })
                    }

                    onArchiveProject(project.id)
                  }}
                >
                  Archive project {project.name}
                </button>
              ) : null}

              {onDeleteProject ? (
                <button
                  type="button"
                  onClick={() => {
                    if (effectiveProjectView === project.id) {
                      updatePreferences({ projectView: 'all' })
                    }

                    onDeleteProject(project.id)
                  }}
                >
                  Delete project {project.name}
                </button>
              ) : null}

              {onCreateTask ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()

                    try {
                      onCreateTask(
                        project.id,
                        taskTitle,
                        newTaskListId || undefined,
                      )
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
                  {projectLists.length > 0 ? (
                    <>
                      <label htmlFor={`new-task-list-${project.id}`}>
                        List for new task in {project.name}
                      </label>
                      <select
                        id={`new-task-list-${project.id}`}
                        value={newTaskListId}
                        onChange={(event) =>
                          setNewTaskLists((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">No list</option>
                        {projectLists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}

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
                    const parentTask =
                      task.parentTaskId === undefined
                        ? undefined
                        : state.tasks.find(
                            (candidate) => candidate.id === task.parentTaskId,
                          )
                    const subtaskTitle = subtaskTitles[task.id] ?? ''
                    const checklistText = checklistTexts[task.id] ?? ''
                    const checklist = task.checklist ?? []
                    const completedChecklistCount = checklist.filter(
                      (item) => item.completed,
                    ).length
                    const immediateSubtaskCount = activeTasks.filter(
                      (candidate) => candidate.parentTaskId === task.id,
                    ).length
                    const relationshipType =
                      relationshipTypes[task.id] ?? 'blocks'
                    const relationshipTarget =
                      relationshipTargets[task.id] ?? ''
                    const taskRelationships = relationships.filter(
                      (relationship) =>
                        relationship.sourceTaskId === task.id ||
                        relationship.targetTaskId === task.id,
                    )
                    const blocksCount = taskRelationships.filter(
                      (relationship) =>
                        relationship.type === 'blocks' &&
                        relationship.sourceTaskId === task.id,
                    ).length
                    const blockedByCount = taskRelationships.filter(
                      (relationship) =>
                        relationship.type === 'blocks' &&
                        relationship.targetTaskId === task.id,
                    ).length
                    const relatedCount = taskRelationships.filter(
                      (relationship) =>
                        relationship.type === 'related',
                    ).length
                    const editedTitle = taskEdits[task.id] ?? task.title
                    const editedDescription = taskDescriptions[task.id] ?? task.description ?? ''

                    return (
                      <li key={task.id}>
                        <span>{task.title}</span>
                        <span
                          aria-label={`Subtask count for ${task.title}`}
                        >
                          {immediateSubtaskCount}{' '}
                          {immediateSubtaskCount === 1
                            ? 'subtask'
                            : 'subtasks'}
                        </span>
                        {onCreateTaskRelationship &&
                        activeTasks.length > 1 ? (
                          <section>
                            <h4>Relationships for {task.title}</h4>
                            <span
                              aria-label={`Relationship summary for ${task.title}`}
                            >
                              Blocks {blocksCount}; Blocked by {blockedByCount};
                              {' '}Related {relatedCount}
                            </span>
                            <form
                              onSubmit={(event) => {
                                event.preventDefault()

                                try {
                                  onCreateTaskRelationship(
                                    relationshipType,
                                    task.id,
                                    relationshipTarget,
                                  )
                                  setRelationshipTargets((current) => ({
                                    ...current,
                                    [task.id]: '',
                                  }))
                                  setError(null)
                                } catch (caught) {
                                  setError(errorMessage(caught))
                                }
                              }}
                            >
                              <label
                                htmlFor={`relationship-type-${task.id}`}
                              >
                                Relationship type from {task.title}
                              </label>
                              <select
                                id={`relationship-type-${task.id}`}
                                value={relationshipType}
                                onChange={(event) =>
                                  setRelationshipTypes((current) => ({
                                    ...current,
                                    [task.id]:
                                      event.target
                                        .value as TaskRelationshipType,
                                  }))
                                }
                              >
                                <option value="blocks">Blocks</option>
                                <option value="related">Related</option>
                              </select>
                              <label
                                htmlFor={`relationship-target-${task.id}`}
                              >
                                Relationship target from {task.title}
                              </label>
                              <select
                                id={`relationship-target-${task.id}`}
                                value={relationshipTarget}
                                onChange={(event) =>
                                  setRelationshipTargets((current) => ({
                                    ...current,
                                    [task.id]: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Select task</option>
                                {activeTasks
                                  .filter(
                                    (candidate) =>
                                      candidate.id !== task.id,
                                  )
                                  .map((candidate) => (
                                    <option
                                      key={candidate.id}
                                      value={candidate.id}
                                    >
                                      Target: {candidate.title}
                                    </option>
                                  ))}
                              </select>
                              <button type="submit">
                                Add relationship from {task.title}
                              </button>
                            </form>

                            {taskRelationships.length > 0 ? (
                              <ul>
                                {taskRelationships.map((relationship) => {
                                  const source = state.tasks.find(
                                    (candidate) =>
                                      candidate.id ===
                                      relationship.sourceTaskId,
                                  )
                                  const target = state.tasks.find(
                                    (candidate) =>
                                      candidate.id ===
                                      relationship.targetTaskId,
                                  )
                                  const label =
                                    relationship.type === 'related'
                                      ? `Related to ${
                                          relationship.sourceTaskId ===
                                          task.id
                                            ? target?.title
                                            : source?.title
                                        }`
                                      : relationship.sourceTaskId ===
                                          task.id
                                        ? `Blocks ${target?.title}`
                                        : `Blocked by ${source?.title}`

                                  return (
                                    <li key={relationship.id}>
                                      <span>{label}</span>
                                      {onDeleteTaskRelationship &&
                                      relationship.sourceTaskId ===
                                        task.id ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onDeleteTaskRelationship(
                                              relationship.id,
                                            )
                                          }
                                        >
                                          Delete relationship {relationship.id}
                                        </button>
                                      ) : null}
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : null}
                          </section>
                        ) : null}

                        {customFields.length > 0 &&
                        onChangeTaskCustomFieldValue ? (
                          <fieldset>
                            <legend>Custom fields for {task.title}</legend>
                            {customFields.map((field) => {
                              const currentValue =
                                task.customFieldValues?.[field.id]
                              const draftKey = `${task.id}:${field.id}`
                              const draftValue =
                                customFieldValueDrafts[draftKey]

                              if (field.type === 'checkbox') {
                                return (
                                  <label key={field.id}>
                                    <input
                                      type="checkbox"
                                      checked={currentValue === true}
                                      onChange={(event) =>
                                        onChangeTaskCustomFieldValue(
                                          task.id,
                                          field.id,
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    Custom field {field.name} for {task.title}
                                  </label>
                                )
                              }

                              return (
                                <label key={field.id}>
                                  Custom field {field.name} for {task.title}
                                  <input
                                    type={
                                      field.type === 'number'
                                        ? 'number'
                                        : 'text'
                                    }
                                    value={
                                      field.type === 'text' &&
                                      draftValue !== undefined
                                        ? draftValue
                                        : typeof currentValue === 'string' ||
                                            typeof currentValue === 'number'
                                          ? currentValue
                                          : ''
                                    }
                                    onChange={(event) => {
                                      const rawValue = event.target.value

                                      if (field.type === 'text') {
                                        setCustomFieldValueDrafts((current) => ({
                                          ...current,
                                          [draftKey]: rawValue,
                                        }))
                                        return
                                      }

                                      if (rawValue === '') {
                                        onChangeTaskCustomFieldValue(
                                          task.id,
                                          field.id,
                                          null,
                                        )
                                        return
                                      }

                                      onChangeTaskCustomFieldValue(
                                        task.id,
                                        field.id,
                                        Number(rawValue),
                                      )
                                    }}
                                    onBlur={(event) => {
                                      if (field.type !== 'text') {
                                        return
                                      }

                                      const rawValue = event.target.value

                                      onChangeTaskCustomFieldValue(
                                        task.id,
                                        field.id,
                                        rawValue === '' ? null : rawValue,
                                      )
                                      setCustomFieldValueDrafts((current) => {
                                        const next = { ...current }
                                        delete next[draftKey]
                                        return next
                                      })
                                    }}
                                  />
                                </label>
                              )
                            })}
                          </fieldset>
                        ) : null}
                        {people.length > 0 &&
                        onChangeTaskAssignee ? (
                          <fieldset>
                            <legend>Assignees for {task.title}</legend>
                            {people.map((person) => (
                              <label key={person.id}>
                                <input
                                  type="checkbox"
                                  checked={(task.assigneeIds ?? []).includes(
                                    person.id,
                                  )}
                                  onChange={(event) =>
                                    onChangeTaskAssignee(
                                      task.id,
                                      person.id,
                                      event.target.checked,
                                    )
                                  }
                                />
                                Assignee {person.name} for {task.title}
                              </label>
                            ))}
                          </fieldset>
                        ) : null}
                        {tags.length > 0 && onChangeTaskTag ? (
                          <fieldset>
                            <legend>Tags for {task.title}</legend>
                            {tags.map((tag) => (
                              <label key={tag.id}>
                                <input
                                  type="checkbox"
                                  checked={(task.tagIds ?? []).includes(tag.id)}
                                  onChange={(event) =>
                                    onChangeTaskTag(
                                      task.id,
                                      tag.id,
                                      event.target.checked,
                                    )
                                  }
                                />
                                Tag {tag.name} for {task.title}
                              </label>
                            ))}
                          </fieldset>
                        ) : null}
                        {taskSort === 'manual' && onMoveTask ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onMoveTask(task.id, 'up')}
                            >
                              Move task {task.title} up
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveTask(task.id, 'down')}
                            >
                              Move task {task.title} down
                            </button>
                          </>
                        ) : null}
                        {parentTask ? (
                          <span>Subtask of {parentTask.title}</span>
                        ) : null}

                        {onCreateSubtask ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault()

                              try {
                                onCreateSubtask(task.id, subtaskTitle)
                                setSubtaskTitles((current) => ({
                                  ...current,
                                  [task.id]: '',
                                }))
                                setError(null)
                              } catch (caught) {
                                setError(errorMessage(caught))
                              }
                            }}
                          >
                            <label htmlFor={`subtask-title-${task.id}`}>
                              Subtask title for {task.title}
                            </label>
                            <input
                              id={`subtask-title-${task.id}`}
                              value={subtaskTitle}
                              onChange={(event) =>
                                setSubtaskTitles((current) => ({
                                  ...current,
                                  [task.id]: event.target.value,
                                }))
                              }
                            />
                            <button type="submit">
                              Add subtask to {task.title}
                            </button>
                          </form>
                        ) : null}

                        {onAddChecklistItem ? (
                          <section>
                            <h4>Checklist for {task.title}</h4>
                            <span
                              aria-label={`Checklist progress for ${task.title}`}
                            >
                              {completedChecklistCount}/{checklist.length}{' '}
                              checklist items complete
                            </span>
                            <form
                              onSubmit={(event) => {
                                event.preventDefault()

                                try {
                                  onAddChecklistItem(task.id, checklistText)
                                  setChecklistTexts((current) => ({
                                    ...current,
                                    [task.id]: '',
                                  }))
                                  setError(null)
                                } catch (caught) {
                                  setError(errorMessage(caught))
                                }
                              }}
                            >
                              <label htmlFor={`checklist-new-${task.id}`}>
                                Checklist item for {task.title}
                              </label>
                              <input
                                id={`checklist-new-${task.id}`}
                                value={checklistText}
                                onChange={(event) =>
                                  setChecklistTexts((current) => ({
                                    ...current,
                                    [task.id]: event.target.value,
                                  }))
                                }
                              />
                              <button type="submit">
                                Add checklist item to {task.title}
                              </button>
                            </form>

                            {checklist.length === 0 ? (
                              <p>No checklist items.</p>
                            ) : (
                              <ul>
                                {checklist.map((item) => {
                                  const editKey = `${task.id}:${item.id}`
                                  const editedChecklistText =
                                    checklistEdits[editKey] ?? item.text

                                  return (
                                    <li key={item.id}>
                                      <span>{item.text}</span>
                                      {onMoveChecklistItem ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onMoveChecklistItem(
                                                task.id,
                                                item.id,
                                                'up',
                                              )
                                            }
                                          >
                                            Move checklist item {item.text} up in {task.title}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onMoveChecklistItem(
                                                task.id,
                                                item.id,
                                                'down',
                                              )
                                            }
                                          >
                                            Move checklist item {item.text} down in {task.title}
                                          </button>
                                        </>
                                      ) : null}
                                      {onChangeChecklistItemCompleted ? (
                                        <>
                                          <label
                                            htmlFor={`checklist-complete-${task.id}-${item.id}`}
                                          >
                                            Checklist item {item.text} complete
                                          </label>
                                          <input
                                            id={`checklist-complete-${task.id}-${item.id}`}
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={(event) =>
                                              onChangeChecklistItemCompleted(
                                                task.id,
                                                item.id,
                                                event.target.checked,
                                              )
                                            }
                                          />
                                        </>
                                      ) : null}

                                      {onRenameChecklistItem ? (
                                        <form
                                          onSubmit={(event) => {
                                            event.preventDefault()

                                            try {
                                              onRenameChecklistItem(
                                                task.id,
                                                item.id,
                                                editedChecklistText,
                                              )
                                              setChecklistEdits((current) => {
                                                const next = { ...current }
                                                delete next[editKey]
                                                return next
                                              })
                                              setError(null)
                                            } catch (caught) {
                                              setError(errorMessage(caught))
                                            }
                                          }}
                                        >
                                          <label
                                            htmlFor={`checklist-edit-${task.id}-${item.id}`}
                                          >
                                            Checklist text for {item.text} in {task.title}
                                          </label>
                                          <input
                                            id={`checklist-edit-${task.id}-${item.id}`}
                                            value={editedChecklistText}
                                            onChange={(event) =>
                                              setChecklistEdits((current) => ({
                                                ...current,
                                                [editKey]: event.target.value,
                                              }))
                                            }
                                          />
                                          <button type="submit">
                                            Save checklist item {item.text}
                                          </button>
                                        </form>
                                      ) : null}

                                      {onDeleteChecklistItem ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onDeleteChecklistItem(
                                              task.id,
                                              item.id,
                                            )
                                          }
                                        >
                                          Delete checklist item {item.text} from {task.title}
                                        </button>
                                      ) : null}
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </section>
                        ) : null}

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

                        {onChangeTaskList ? (
                          <>
                            <label htmlFor={`task-list-${task.id}`}>
                              List for {task.title}
                            </label>
                            <select
                              id={`task-list-${task.id}`}
                              value={task.listId ?? ''}
                              onChange={(event) =>
                                onChangeTaskList(
                                  task.id,
                                  event.target.value || null,
                                )
                              }
                            >
                              <option value="">No list</option>
                              {projectLists.map((list) => (
                                <option key={list.id} value={list.id}>
                                  {list.name}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : null}

                        {onChangeTaskProject ? (
                          <>
                            <label htmlFor={`task-project-${task.id}`}>
                              Project for {task.title}
                            </label>
                            <select
                              id={`task-project-${task.id}`}
                              value={task.projectId}
                              onChange={(event) =>
                                onChangeTaskProject(
                                  task.id,
                                  event.target.value,
                                )
                              }
                            >
                              {activeProjects.map((candidateProject) => (
                                <option
                                  key={candidateProject.id}
                                  value={candidateProject.id}
                                >
                                  {candidateProject.name}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : null}

                        {onDuplicateTask ? (
                          <button
                            type="button"
                            onClick={() => onDuplicateTask(task.id)}
                          >
                            Duplicate task {task.title}
                          </button>
                        ) : null}
                        {onSaveTaskTemplate ? (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                onSaveTaskTemplate(task.id, task.title)
                                setError(null)
                              } catch (caught) {
                                setError(errorMessage(caught))
                              }
                            }}
                          >
                            Save task as template {task.title}
                          </button>
                        ) : null}
                        {onArchiveTask ? (
                          <button
                            type="button"
                            onClick={() => onArchiveTask(task.id)}
                          >
                            Archive task {task.title}
                          </button>
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


      {taskTemplates.length > 0 ? (
        <section>
          <h2>Task templates</h2>
          <ul>
            {taskTemplates.map((template) => {
              const selectedProjectId =
                taskTemplateProjects[template.id] !== undefined &&
                activeProjects.some(
                  (project) =>
                    project.id === taskTemplateProjects[template.id],
                )
                  ? taskTemplateProjects[template.id]
                  : activeProjects[0]?.id ?? ''
              const templateLists = lists.filter(
                (list) => list.projectId === selectedProjectId,
              )
              const selectedListId = templateLists.some(
                (list) => list.id === taskTemplateLists[template.id],
              )
                ? taskTemplateLists[template.id]
                : ''

              return (
                <li key={template.id}>
                  <span>{template.name}</span>
                  <label htmlFor={`task-template-project-${template.id}`}>
                    Project for task template {template.name}
                  </label>
                  <select
                    id={`task-template-project-${template.id}`}
                    value={selectedProjectId}
                    onChange={(event) => {
                      setTaskTemplateProjects((current) => ({
                        ...current,
                        [template.id]: event.target.value,
                      }))
                      setTaskTemplateLists((current) => ({
                        ...current,
                        [template.id]: '',
                      }))
                    }}
                  >
                    {activeProjects.length === 0 ? (
                      <option value="">No active projects</option>
                    ) : null}
                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor={`task-template-list-${template.id}`}>
                    List for task template {template.name}
                  </label>
                  <select
                    id={`task-template-list-${template.id}`}
                    value={selectedListId}
                    onChange={(event) =>
                      setTaskTemplateLists((current) => ({
                        ...current,
                        [template.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">No list</option>
                    {templateLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                  {onCreateTaskFromTemplate ? (
                    <button
                      type="button"
                      disabled={!selectedProjectId}
                      onClick={() => {
                        try {
                          onCreateTaskFromTemplate(
                            template.id,
                            selectedProjectId,
                            selectedListId || undefined,
                          )
                          setError(null)
                        } catch (caught) {
                          setError(errorMessage(caught))
                        }
                      }}
                    >
                      Create task from template {template.name}
                    </button>
                  ) : null}
                  {onDeleteTaskTemplate ? (
                    <button
                      type="button"
                      onClick={() => onDeleteTaskTemplate(template.id)}
                    >
                      Delete task template {template.name}
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {projectTemplates.length > 0 ? (
        <section>
          <h2>Project templates</h2>
          <ul>
            {projectTemplates.map((template) => (
              <li key={template.id}>
                <span>{template.name}</span>
                {onCreateProjectFromTemplate ? (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        onCreateProjectFromTemplate(template.id)
                        setError(null)
                      } catch (caught) {
                        setError(errorMessage(caught))
                      }
                    }}
                  >
                    Create project from template {template.name}
                  </button>
                ) : null}
                {onDeleteProjectTemplate ? (
                  <button
                    type="button"
                    onClick={() => onDeleteProjectTemplate(template.id)}
                  >
                    Delete project template {template.name}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {archivedProjects.length > 0 ? (
        <section>
          <h2>Archived projects</h2>
          <ul>
            {archivedProjects.map((project) => (
              <li key={project.id}>
                <span>{project.name}</span>
                {onRestoreProject ? (
                  <button
                    type="button"
                    onClick={() => onRestoreProject(project.id)}
                  >
                    Restore project {project.name}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {archivedTaskRoots.length > 0 ? (
        <section>
          <h2>Archived tasks</h2>
          <ul>
            {archivedTaskRoots.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                {onRestoreTask ? (
                  <button
                    type="button"
                    onClick={() => onRestoreTask(task.id)}
                  >
                    Restore task {task.title}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
