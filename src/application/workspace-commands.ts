import { createChecklistItem } from '../domain/checklist'
import {
  createCustomField,
  type CustomFieldFormula,
  type CustomFieldOption,
  type CustomFieldType,
  type CustomFieldValue,
} from '../domain/custom-field'
import { createArea } from '../domain/area'
import {
  createProject,
  createProjectTemplate,
  instantiateProjectTemplate,
} from '../domain/project'
import { createPerson } from '../domain/person'
import { createTaskList } from '../domain/task-list'
import {
  createTaskRelationship,
  type TaskRelationshipType,
} from '../domain/task-relationship'
import { createTag } from '../domain/tag'
import {
  createNextRecurringTaskOccurrence,
  createSubtask,
  createTask,
  duplicateTask as duplicateTaskDomain,
  createTaskTemplate,
  instantiateTaskTemplate,
  type TaskPriority,
  type TaskRecurrenceRule,
  type TaskStatus,
} from '../domain/task'
import type { MoveDirection } from '../domain/manual-order'
import type { WorkspaceStore } from './workspace-store'

export interface WorkspaceRuntime {
  nextId(): string
  now(): string
}

export interface WorkspaceCommands {
  addTaskRelationship(type: TaskRelationshipType, sourceTaskId: string, targetTaskId: string): ReturnType<typeof createTaskRelationship>
  deleteTaskRelationship(relationshipId: string): void
  addCustomField(name: string, type: CustomFieldType): ReturnType<typeof createCustomField>
  renameCustomField(fieldId: string, name: string): void
  changeCustomFieldType(fieldId: string, nextType: CustomFieldType): void
  deleteCustomField(fieldId: string): void
  configureCustomFieldFormula(fieldId: string, formula: CustomFieldFormula | null): void
  addCustomFieldOption(fieldId: string, name: string): CustomFieldOption
  renameCustomFieldOption(fieldId: string, optionId: string, name: string): void
  deleteCustomFieldOption(fieldId: string, optionId: string): void
  changeTaskCustomFieldValue(taskId: string, fieldId: string, value: CustomFieldValue | null): void
  addPerson(name: string): ReturnType<typeof createPerson>
  renamePerson(personId: string, name: string): void
  deletePerson(personId: string): void
  assignTaskAssignee(taskId: string, personId: string): void
  removeTaskAssignee(taskId: string, personId: string): void
  addTag(name: string): ReturnType<typeof createTag>
  renameTag(tagId: string, name: string): void
  deleteTag(tagId: string): void
  assignTaskTag(taskId: string, tagId: string): void
  removeTaskTag(taskId: string, tagId: string): void
  addArea(name: string): ReturnType<typeof createArea>
  renameArea(areaId: string, name: string): void
  deleteArea(areaId: string): void
  moveArea(areaId: string, direction: MoveDirection): void
  changeProjectArea(projectId: string, areaId: string | null): void
  addTaskList(projectId: string, name: string): ReturnType<typeof createTaskList>
  renameTaskList(listId: string, name: string): void
  deleteTaskList(listId: string): void
  moveTaskList(listId: string, direction: MoveDirection): void
  changeTaskList(taskId: string, listId: string | null): void
  addChecklistItem(taskId: string, text: string): ReturnType<typeof createChecklistItem>
  renameChecklistItem(taskId: string, itemId: string, text: string): void
  changeChecklistItemCompleted(taskId: string, itemId: string, completed: boolean): void
  deleteChecklistItem(taskId: string, itemId: string): void
  moveChecklistItem(taskId: string, itemId: string, direction: MoveDirection): void
  moveProject(projectId: string, direction: MoveDirection): void
  addProject(name: string): ReturnType<typeof createProject>
  saveProjectTemplate(projectId: string, name: string): ReturnType<typeof createProjectTemplate>
  createProjectFromTemplate(templateId: string): ReturnType<typeof createProject>
  deleteProjectTemplate(templateId: string): void
  saveTaskTemplate(taskId: string, name: string): ReturnType<typeof createTaskTemplate>
  createTaskFromTemplate(templateId: string, projectId: string, listId?: string): ReturnType<typeof createTask>
  deleteTaskTemplate(templateId: string): void
  addTask(projectId: string, title: string, listId?: string): ReturnType<typeof createTask>
  addSubtask(parentTaskId: string, title: string): ReturnType<typeof createSubtask>
  duplicateTask(taskId: string): ReturnType<typeof duplicateTaskDomain>
  archiveTask(taskId: string): void
  archiveTasks(taskIds: string[]): void
  restoreTask(taskId: string): void
  archiveProject(projectId: string): void
  restoreProject(projectId: string): void
  renameProject(projectId: string, name: string): void
  changeProjectDescription(projectId: string, description: string | null): void
  renameTask(taskId: string, title: string): void
  changeTaskStatus(taskId: string, status: TaskStatus): void
  changeTaskRecurrence(taskId: string, recurrence: TaskRecurrenceRule | null): void
  changeTaskTimeEstimate(taskId: string, estimateMinutes: number | null): void
  changeTasksStatus(taskIds: string[], status: TaskStatus): void
  changeTaskPriority(taskId: string, priority: TaskPriority): void
  changeTasksPriority(taskIds: string[], priority: TaskPriority): void
  changeTaskStartDate(taskId: string, startDate: string | null): void
  changeTaskDueDate(taskId: string, dueDate: string | null): void
  changeTaskDescription(taskId: string, description: string | null): void
  changeTaskProject(taskId: string, projectId: string): void
  moveTask(taskId: string, direction: MoveDirection): void
  deleteTask(taskId: string): void
  deleteProject(projectId: string): void
}

export function createWorkspaceCommands(
  store: WorkspaceStore,
  runtime: WorkspaceRuntime,
): WorkspaceCommands {
  return {
    addTaskRelationship(type, sourceTaskId, targetTaskId) {
      const relationship = createTaskRelationship({
        id: runtime.nextId(),
        type,
        sourceTaskId,
        targetTaskId,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'relationship/added',
        relationship,
      })

      return relationship
    },

    deleteTaskRelationship(relationshipId) {
      store.dispatch({
        type: 'relationship/deleted',
        relationshipId,
      })
    },

    addCustomField(name, type) {
      const field = createCustomField({
        id: runtime.nextId(),
        name,
        type,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'customField/added',
        field,
      })

      return field
    },

    renameCustomField(fieldId, name) {
      store.dispatch({
        type: 'customField/nameChanged',
        fieldId,
        name,
      })
    },

    changeCustomFieldType(fieldId, nextType) {
      const field = store.getState().customFields?.find(
        (candidate) => candidate.id === fieldId,
      )

      if (!field) {
        throw new Error('Cannot change type of a missing custom field')
      }

      if (field.type === nextType) {
        return
      }

      store.dispatch({
        type: 'customField/typeChanged',
        fieldId,
        nextType,
      })
    },

    deleteCustomField(fieldId) {
      store.dispatch({
        type: 'customField/deleted',
        fieldId,
      })
    },

    configureCustomFieldFormula(fieldId, formula) {
      store.dispatch({
        type: 'customField/formulaChanged',
        fieldId,
        formula,
      })
    },

    addCustomFieldOption(fieldId, name) {
      const option: CustomFieldOption = {
        id: runtime.nextId().trim(),
        name: name.trim(),
      }

      if (!option.id) {
        throw new Error('Custom field option id is required')
      }

      if (!option.name) {
        throw new Error('Custom field option name is required')
      }

      store.dispatch({
        type: 'customField/optionAdded',
        fieldId,
        option,
      })

      return option
    },

    renameCustomFieldOption(fieldId, optionId, name) {
      store.dispatch({
        type: 'customField/optionNameChanged',
        fieldId,
        optionId,
        name,
      })
    },

    deleteCustomFieldOption(fieldId, optionId) {
      store.dispatch({
        type: 'customField/optionDeleted',
        fieldId,
        optionId,
      })
    },

    changeTaskCustomFieldValue(taskId, fieldId, value) {
      store.dispatch({
        type: 'task/customFieldValueChanged',
        taskId,
        fieldId,
        value,
      })
    },

    addPerson(name) {
      const person = createPerson({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'person/added',
        person,
      })

      return person
    },

    renamePerson(personId, name) {
      store.dispatch({
        type: 'person/nameChanged',
        personId,
        name,
      })
    },

    deletePerson(personId) {
      store.dispatch({
        type: 'person/deleted',
        personId,
      })
    },

    assignTaskAssignee(taskId, personId) {
      store.dispatch({
        type: 'task/assigneeAdded',
        taskId,
        personId,
      })
    },

    removeTaskAssignee(taskId, personId) {
      store.dispatch({
        type: 'task/assigneeRemoved',
        taskId,
        personId,
      })
    },

    addTag(name) {
      const tag = createTag({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'tag/added',
        tag,
      })

      return tag
    },

    renameTag(tagId, name) {
      store.dispatch({
        type: 'tag/nameChanged',
        tagId,
        name,
      })
    },

    deleteTag(tagId) {
      store.dispatch({
        type: 'tag/deleted',
        tagId,
      })
    },

    assignTaskTag(taskId, tagId) {
      store.dispatch({
        type: 'task/tagAdded',
        taskId,
        tagId,
      })
    },

    removeTaskTag(taskId, tagId) {
      store.dispatch({
        type: 'task/tagRemoved',
        taskId,
        tagId,
      })
    },

    addArea(name) {
      const area = createArea({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'area/added',
        area,
      })

      return area
    },

    moveArea(areaId, direction) {
      store.dispatch({
        type: 'area/moved',
        areaId,
        direction,
      })
    },

    renameArea(areaId, name) {
      store.dispatch({
        type: 'area/nameChanged',
        areaId,
        name,
      })
    },

    deleteArea(areaId) {
      store.dispatch({
        type: 'area/deleted',
        areaId,
      })
    },

    changeProjectArea(projectId, areaId) {
      store.dispatch({
        type: 'project/areaChanged',
        projectId,
        areaId,
      })
    },

    addTaskList(projectId, name) {
      const list = createTaskList({
        id: runtime.nextId(),
        projectId,
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'list/added',
        list,
      })

      return list
    },

    moveTaskList(listId, direction) {
      store.dispatch({
        type: 'list/moved',
        listId,
        direction,
      })
    },

    renameTaskList(listId, name) {
      store.dispatch({
        type: 'list/nameChanged',
        listId,
        name,
      })
    },

    deleteTaskList(listId) {
      store.dispatch({
        type: 'list/deleted',
        listId,
      })
    },

    changeTaskList(taskId, listId) {
      store.dispatch({
        type: 'task/listChanged',
        taskId,
        listId,
      })
    },

    moveChecklistItem(taskId, itemId, direction) {
      store.dispatch({
        type: 'task/checklistItemMoved',
        taskId,
        itemId,
        direction,
      })
    },

    addChecklistItem(taskId, text) {
      const item = createChecklistItem({
        id: runtime.nextId(),
        text,
      })

      store.dispatch({
        type: 'task/checklistItemAdded',
        taskId,
        item,
      })

      return item
    },

    renameChecklistItem(taskId, itemId, text) {
      store.dispatch({
        type: 'task/checklistItemTextChanged',
        taskId,
        itemId,
        text,
      })
    },

    changeChecklistItemCompleted(taskId, itemId, completed) {
      store.dispatch({
        type: 'task/checklistItemCompletedChanged',
        taskId,
        itemId,
        completed,
      })
    },

    deleteChecklistItem(taskId, itemId) {
      store.dispatch({
        type: 'task/checklistItemDeleted',
        taskId,
        itemId,
      })
    },

    moveProject(projectId, direction) {
      store.dispatch({
        type: 'project/moved',
        projectId,
        direction,
      })
    },

    addProject(name) {
      const project = createProject({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'project/added',
        project,
      })

      return project
    },

    saveProjectTemplate(projectId, name) {
      const state = store.getState()
      const project = state.projects.find(
        (candidate) =>
          candidate.id === projectId && candidate.archivedAt === undefined,
      )

      if (!project) {
        throw new Error('Cannot template a missing or archived project')
      }

      const template = createProjectTemplate({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
        project,
        lists: state.lists ?? [],
        tasks: state.tasks,
      })

      store.dispatch({
        type: 'projectTemplate/added',
        template,
      })

      return template
    },

    createProjectFromTemplate(templateId) {
      const template = (store.getState().projectTemplates ?? []).find(
        (candidate) => candidate.id === templateId,
      )

      if (!template) {
        throw new Error('Cannot create a project from a missing template')
      }

      const now = runtime.now()
      const instance = instantiateProjectTemplate(template, {
        now,
        nextId: () => runtime.nextId(),
      })

      store.dispatch({
        type: 'projectTemplate/instantiated',
        ...instance,
      })

      return instance.project
    },

    deleteProjectTemplate(templateId) {
      const exists = (store.getState().projectTemplates ?? []).some(
        (template) => template.id === templateId,
      )

      if (!exists) {
        throw new Error('Cannot delete a missing project template')
      }

      store.dispatch({
        type: 'projectTemplate/deleted',
        templateId,
      })
    },

    saveTaskTemplate(taskId, name) {
      const state = store.getState()
      const rootTask = state.tasks.find(
        (task) => task.id === taskId && task.archivedAt === undefined,
      )
      const project = rootTask
        ? state.projects.find(
            (candidate) =>
              candidate.id === rootTask.projectId &&
              candidate.archivedAt === undefined,
          )
        : undefined

      if (!rootTask || !project) {
        throw new Error('Cannot template a missing or archived task')
      }

      const template = createTaskTemplate({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
        rootTask,
        tasks: state.tasks,
      })

      store.dispatch({
        type: 'taskTemplate/added',
        template,
      })

      return template
    },

    createTaskFromTemplate(templateId, projectId, listId) {
      const state = store.getState()
      const template = (state.taskTemplates ?? []).find(
        (candidate) => candidate.id === templateId,
      )
      const project = state.projects.find(
        (candidate) =>
          candidate.id === projectId && candidate.archivedAt === undefined,
      )

      if (!template) {
        throw new Error('Cannot create a task from a missing template')
      }

      if (!project) {
        throw new Error('Cannot create a task in a missing or archived project')
      }

      if (
        listId !== undefined &&
        !(state.lists ?? []).some(
          (list) => list.id === listId && list.projectId === projectId,
        )
      ) {
        throw new Error('Cannot create a task in an incompatible list')
      }

      const instance = instantiateTaskTemplate(template, {
        projectId,
        listId,
        now: runtime.now(),
        nextId: () => runtime.nextId(),
      })

      store.dispatch({
        type: 'taskTemplate/instantiated',
        tasks: instance.tasks,
      })

      return instance.rootTask
    },

    deleteTaskTemplate(templateId) {
      const exists = (store.getState().taskTemplates ?? []).some(
        (template) => template.id === templateId,
      )

      if (!exists) {
        throw new Error('Cannot delete a missing task template')
      }

      store.dispatch({
        type: 'taskTemplate/deleted',
        templateId,
      })
    },

    addTask(projectId, title, listId) {
      const task = createTask({
        id: runtime.nextId(),
        projectId,
        title,
        now: runtime.now(),
        listId,
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },

    addSubtask(parentTaskId, title) {
      const parent = store
        .getState()
        .tasks.find((task) => task.id === parentTaskId)

      if (!parent) {
        throw new Error('Cannot create a subtask for a missing task')
      }

      const task = createSubtask({
        id: runtime.nextId(),
        parent,
        title,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },

    duplicateTask(taskId) {
      const source = store
        .getState()
        .tasks.find((task) => task.id === taskId)

      if (!source) {
        throw new Error('Cannot duplicate a missing task')
      }

      const task = duplicateTaskDomain(source, {
        id: runtime.nextId(),
        now: runtime.now(),
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },


    archiveTask(taskId) {
      const exists = store
        .getState()
        .tasks.some((task) => task.id === taskId)

      if (!exists) {
        throw new Error('Cannot archive a missing task')
      }

      store.dispatch({
        type: 'task/archived',
        taskId,
        archivedAt: runtime.now(),
      })
    },

    archiveTasks(taskIds) {
      store.dispatch({
        type: 'task/archivedBulk',
        taskIds: [...taskIds],
        archivedAt: runtime.now(),
      })
    },

    restoreTask(taskId) {
      const exists = store
        .getState()
        .tasks.some((task) => task.id === taskId)

      if (!exists) {
        throw new Error('Cannot restore a missing task')
      }

      store.dispatch({
        type: 'task/restored',
        taskId,
      })
    },

    archiveProject(projectId) {
      const exists = store
        .getState()
        .projects.some((project) => project.id === projectId)

      if (!exists) {
        throw new Error('Cannot archive a missing project')
      }

      store.dispatch({
        type: 'project/archived',
        projectId,
        archivedAt: runtime.now(),
      })
    },

    restoreProject(projectId) {
      const exists = store
        .getState()
        .projects.some((project) => project.id === projectId)

      if (!exists) {
        throw new Error('Cannot restore a missing project')
      }

      store.dispatch({
        type: 'project/restored',
        projectId,
      })
    },

    renameProject(projectId, name) {
      store.dispatch({
        type: 'project/nameChanged',
        projectId,
        name,
      })
    },

    changeProjectDescription(projectId, description) {
      store.dispatch({
        type: 'project/descriptionChanged',
        projectId,
        description,
      })
    },

    renameTask(taskId, title) {
      store.dispatch({
        type: 'task/titleChanged',
        taskId,
        title,
      })
    },

    changeTaskStatus(taskId, status) {
      const task = store.getState().tasks.find((candidate) => candidate.id === taskId)

      if (
        task?.recurrence !== undefined &&
        task.status !== 'done' &&
        status === 'done'
      ) {
        const occurrence = createNextRecurringTaskOccurrence(
          { ...task, status: 'done' },
          {
            id: runtime.nextId(),
            now: runtime.now(),
          },
        )

        store.dispatch({
          type: 'task/recurringCompleted',
          taskId,
          occurrence,
        })
        return
      }

      store.dispatch({
        type: 'task/statusChanged',
        taskId,
        status,
      })
    },

    changeTaskRecurrence(taskId, recurrence) {
      store.dispatch({
        type: 'task/recurrenceChanged',
        taskId,
        recurrence,
      })
    },

    changeTaskTimeEstimate(taskId, estimateMinutes) {
      store.dispatch({
        type: 'task/timeEstimateChanged',
        taskId,
        estimateMinutes,
      })
    },

    changeTasksStatus(taskIds, status) {
      store.dispatch({
        type: 'task/statusChangedBulk',
        taskIds: [...taskIds],
        status,
      })
    },

    changeTaskPriority(taskId, priority) {
      store.dispatch({
        type: 'task/priorityChanged',
        taskId,
        priority,
      })
    },

    changeTasksPriority(taskIds, priority) {
      store.dispatch({
        type: 'task/priorityChangedBulk',
        taskIds: [...taskIds],
        priority,
      })
    },

    changeTaskStartDate(taskId, startDate) {
      store.dispatch({
        type: 'task/startDateChanged',
        taskId,
        startDate,
      })
    },

    changeTaskDueDate(taskId, dueDate) {
      store.dispatch({
        type: 'task/dueDateChanged',
        taskId,
        dueDate,
      })
    },

    changeTaskDescription(taskId, description) {
      store.dispatch({
        type: 'task/descriptionChanged',
        taskId,
        description,
      })
    },

    changeTaskProject(taskId, projectId) {
      store.dispatch({
        type: 'task/projectChanged',
        taskId,
        projectId,
      })
    },

    moveTask(taskId, direction) {
      store.dispatch({
        type: 'task/moved',
        taskId,
        direction,
      })
    },

    deleteTask(taskId) {
      store.dispatch({
        type: 'task/deleted',
        taskId,
      })
    },

    deleteProject(projectId) {
      store.dispatch({
        type: 'project/deleted',
        projectId,
      })
    },
  }
}
