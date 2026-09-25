import {
  renameAutomation,
  setAutomationActions,
  setAutomationConditions,
  setAutomationEnabled,
  setAutomationTrigger,
  validateAutomation,
  type Automation,
  type AutomationAction,
  type AutomationCondition,
  type AutomationTrigger,
} from './automation'
import { deriveTaskActivityEntries, type TaskActivityEntry } from './task-activity'
import { renameArea, type Area } from './area'
import {
  renameChecklistItem,
  setChecklistItemCompleted,
  type ChecklistItem,
} from './checklist'
import { renameTaskList, type TaskList } from './task-list'
import type { TaskRelationship } from './task-relationship'
import {
  addCustomFieldOption,
  clearCustomFieldFormula,
  configureCustomFieldFormula,
  deleteCustomFieldOption,
  migrateCustomFieldType,
  normalizeCustomFieldValueForDefinition,
  renameCustomField,
  renameCustomFieldOption,
  validateCustomFieldFormulaDependencies,
  type CustomFieldDefinition,
  type CustomFieldFormula,
  type CustomFieldOption,
  type CustomFieldType,
  type CustomFieldValue,
} from './custom-field'
import { renamePerson, type Person } from './person'
import { renameTag, type Tag } from './tag'
import {
  moveItemWithinGroup,
  type MoveDirection,
} from './manual-order'
import {
  archiveProject,
  moveProjectToArea,
  renameProject,
  restoreProject,
  setProjectDescription,
  type Project,
  type ProjectTemplate,
} from './project'
import {
  addTaskAttachment,
  addTaskTrackedMinutes,
  archiveTask,
  deleteTaskAttachment,
  deleteTaskTimeEntry,
  moveTaskToProject,
  renameTask,
  restoreTask,
  setTaskDescription,
  setTaskList,
  setTaskDueDate,
  setTaskRecurrence,
  setTaskTimeEstimate,
  startTaskTimer,
  stopTaskTimer,
  setTaskStartDate,
  type Task,
  type TaskPriority,
  type TaskRecurrenceRule,
  type TaskStatus,
  type TaskTemplate,
} from './task'

export interface WorkspaceState {
  activity?: TaskActivityEntry[]
  automations?: Automation[]
  areas?: Area[]
  lists?: TaskList[]
  tags?: Tag[]
  people?: Person[]
  customFields?: CustomFieldDefinition[]
  relationships?: TaskRelationship[]
  projects: Project[]
  projectTemplates?: ProjectTemplate[]
  taskTemplates?: TaskTemplate[]
  tasks: Task[]
}

export const emptyWorkspace: WorkspaceState = {
  areas: [],
  lists: [],
  projects: [],
  tasks: [],
}

export type WorkspaceBaseAction =
  | { type: 'automation/added'; automation: Automation }
  | { type: 'automation/deleted'; automationId: string }
  | { type: 'automation/nameChanged'; automationId: string; name: string }
  | { type: 'automation/enabledChanged'; automationId: string; enabled: boolean }
  | { type: 'automation/triggerChanged'; automationId: string; trigger: AutomationTrigger }
  | {
      type: 'automation/conditionsChanged'
      automationId: string
      conditions: AutomationCondition[]
    }
  | {
      type: 'automation/actionsChanged'
      automationId: string
      actions: AutomationAction[]
    }
  | { type: 'area/added'; area: Area }
  | { type: 'area/deleted'; areaId: string }
  | { type: 'area/nameChanged'; areaId: string; name: string }
  | { type: 'area/moved'; areaId: string; direction: MoveDirection }
  | { type: 'customField/added'; field: CustomFieldDefinition }
  | { type: 'customField/deleted'; fieldId: string }
  | { type: 'customField/nameChanged'; fieldId: string; name: string }
  | { type: 'customField/typeChanged'; fieldId: string; nextType: CustomFieldType }
  | { type: 'customField/formulaChanged'; fieldId: string; formula: CustomFieldFormula | null }
  | { type: 'customField/optionAdded'; fieldId: string; option: CustomFieldOption }
  | { type: 'customField/optionNameChanged'; fieldId: string; optionId: string; name: string }
  | { type: 'customField/optionDeleted'; fieldId: string; optionId: string }
  | { type: 'person/added'; person: Person }
  | { type: 'person/deleted'; personId: string }
  | { type: 'person/nameChanged'; personId: string; name: string }
  | { type: 'tag/added'; tag: Tag }
  | { type: 'tag/deleted'; tagId: string }
  | { type: 'tag/nameChanged'; tagId: string; name: string }
  | { type: 'list/added'; list: TaskList }
  | { type: 'list/deleted'; listId: string }
  | { type: 'list/nameChanged'; listId: string; name: string }
  | { type: 'list/moved'; listId: string; direction: MoveDirection }
  | { type: 'relationship/added'; relationship: TaskRelationship }
  | { type: 'relationship/deleted'; relationshipId: string }
  | { type: 'projectTemplate/added'; template: ProjectTemplate }
  | { type: 'projectTemplate/deleted'; templateId: string }
  | { type: 'projectTemplate/instantiated'; project: Project; lists: TaskList[]; tasks: Task[] }
  | { type: 'taskTemplate/added'; template: TaskTemplate }
  | { type: 'taskTemplate/deleted'; templateId: string }
  | { type: 'taskTemplate/instantiated'; tasks: Task[] }
  | { type: 'project/added'; project: Project }
  | { type: 'project/archived'; projectId: string; archivedAt: string }
  | { type: 'project/restored'; projectId: string }
  | { type: 'project/deleted'; projectId: string }
  | { type: 'project/nameChanged'; projectId: string; name: string }
  | { type: 'project/descriptionChanged'; projectId: string; description: string | null }
  | { type: 'project/areaChanged'; projectId: string; areaId: string | null }
  | { type: 'project/moved'; projectId: string; direction: MoveDirection }
  | { type: 'task/added'; task: Task }
  | { type: 'task/archived'; taskId: string; archivedAt: string }
  | { type: 'task/archivedBulk'; taskIds: string[]; archivedAt: string }
  | { type: 'task/restored'; taskId: string }
  | { type: 'task/statusChanged'; taskId: string; status: TaskStatus }
  | { type: 'task/recurringCompleted'; taskId: string; occurrence: Task }
  | { type: 'task/recurrenceChanged'; taskId: string; recurrence: TaskRecurrenceRule | null }
  | { type: 'task/timeEstimateChanged'; taskId: string; estimateMinutes: number | null }
  | { type: 'task/timeTrackedManually'; taskId: string; entryId: string; minutes: number; now: string }
  | { type: 'task/timerStarted'; taskId: string; startedAt: string }
  | { type: 'task/timerStopped'; taskId: string; entryId: string; stoppedAt: string }
  | { type: 'task/timeEntryDeleted'; taskId: string; entryId: string }
  | {
      type: 'task/attachmentAdded'
      taskId: string
      attachmentId: string
      name: string
      sizeBytes: number
      mediaType?: string
      now: string
    }
  | { type: 'task/attachmentDeleted'; taskId: string; attachmentId: string }
  | { type: 'task/statusChangedBulk'; taskIds: string[]; status: TaskStatus }
  | { type: 'task/titleChanged'; taskId: string; title: string }
  | { type: 'task/priorityChanged'; taskId: string; priority: TaskPriority }
  | { type: 'task/priorityChangedBulk'; taskIds: string[]; priority: TaskPriority }
  | { type: 'task/startDateChanged'; taskId: string; startDate: string | null }
  | { type: 'task/dueDateChanged'; taskId: string; dueDate: string | null }
  | { type: 'task/descriptionChanged'; taskId: string; description: string | null }
  | { type: 'task/projectChanged'; taskId: string; projectId: string }
  | { type: 'task/listChanged'; taskId: string; listId: string | null }
  | { type: 'task/moved'; taskId: string; direction: MoveDirection }
  | { type: 'task/customFieldValueChanged'; taskId: string; fieldId: string; value: CustomFieldValue | null }
  | { type: 'task/assigneeAdded'; taskId: string; personId: string }
  | { type: 'task/assigneeRemoved'; taskId: string; personId: string }
  | { type: 'task/tagAdded'; taskId: string; tagId: string }
  | { type: 'task/tagRemoved'; taskId: string; tagId: string }
  | { type: 'task/checklistItemAdded'; taskId: string; item: ChecklistItem }
  | { type: 'task/checklistItemTextChanged'; taskId: string; itemId: string; text: string }
  | { type: 'task/checklistItemCompletedChanged'; taskId: string; itemId: string; completed: boolean }
  | { type: 'task/checklistItemDeleted'; taskId: string; itemId: string }
  | { type: 'task/checklistItemMoved'; taskId: string; itemId: string; direction: MoveDirection }
  | { type: 'task/deleted'; taskId: string }

export type ActivityTrackableWorkspaceAction = Extract<
  WorkspaceBaseAction,
  {
    type:
      | 'projectTemplate/instantiated'
      | 'taskTemplate/instantiated'
      | 'project/deleted'
      | 'task/added'
      | 'task/archived'
      | 'task/archivedBulk'
      | 'task/restored'
      | 'task/statusChanged'
      | 'task/recurringCompleted'
      | 'task/statusChangedBulk'
      | 'task/titleChanged'
      | 'task/priorityChanged'
      | 'task/priorityChangedBulk'
      | 'task/startDateChanged'
      | 'task/dueDateChanged'
      | 'task/projectChanged'
      | 'task/listChanged'
      | 'task/deleted'
  }
>

export type WorkspaceAction =
  | WorkspaceBaseAction
  | {
      type: 'workspace/taskActivityTracked'
      occurredAt: string
      action: ActivityTrackableWorkspaceAction
    }



function collectTaskSubtreeIds(tasks: Task[], rootTaskId: string): Set<string> {
  const taskIds = new Set([rootTaskId])
  let changed = true

  while (changed) {
    changed = false

    for (const task of tasks) {
      if (
        task.parentTaskId !== undefined &&
        taskIds.has(task.parentTaskId) &&
        !taskIds.has(task.id)
      ) {
        taskIds.add(task.id)
        changed = true
      }
    }
  }

  return taskIds
}

function createsDependencyCycle(
  relationships: TaskRelationship[],
  sourceTaskId: string,
  targetTaskId: string,
): boolean {
  const adjacency = new Map<string, string[]>()

  for (const relationship of relationships) {
    if (relationship.type !== 'blocks') {
      continue
    }

    const targets = adjacency.get(relationship.sourceTaskId) ?? []
    targets.push(relationship.targetTaskId)
    adjacency.set(relationship.sourceTaskId, targets)
  }

  const pending = [targetTaskId]
  const visited = new Set<string>()

  while (pending.length > 0) {
    const current = pending.pop()

    if (current === undefined || visited.has(current)) {
      continue
    }

    if (current === sourceTaskId) {
      return true
    }

    visited.add(current)
    pending.push(...(adjacency.get(current) ?? []))
  }

  return false
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  if (action.type === 'workspace/taskActivityTracked') {
    const next = workspaceReducer(state, action.action)
    const entries = deriveTaskActivityEntries(
      state,
      next,
      action.action,
      action.occurredAt,
    )

    if (entries.length === 0) {
      return next
    }

    return {
      ...next,
      activity: [...(state.activity ?? []), ...entries],
    }
  }

  switch (action.type) {
    case 'automation/added': {
      validateAutomation(action.automation)

      if (
        (state.automations ?? []).some(
          (automation) => automation.id === action.automation.id,
        )
      ) {
        throw new Error('Automation id must be unique')
      }

      return {
        ...state,
        automations: [...(state.automations ?? []), action.automation],
      }
    }

    case 'automation/nameChanged':
      return {
        ...state,
        automations: (state.automations ?? []).map((automation) =>
          automation.id === action.automationId
            ? renameAutomation(automation, action.name)
            : automation,
        ),
      }

    case 'automation/enabledChanged':
      return {
        ...state,
        automations: (state.automations ?? []).map((automation) =>
          automation.id === action.automationId
            ? setAutomationEnabled(automation, action.enabled)
            : automation,
        ),
      }

    case 'automation/triggerChanged':
      return {
        ...state,
        automations: (state.automations ?? []).map((automation) =>
          automation.id === action.automationId
            ? setAutomationTrigger(automation, action.trigger)
            : automation,
        ),
      }

    case 'automation/conditionsChanged':
      return {
        ...state,
        automations: (state.automations ?? []).map((automation) =>
          automation.id === action.automationId
            ? setAutomationConditions(automation, action.conditions)
            : automation,
        ),
      }

    case 'automation/actionsChanged':
      return {
        ...state,
        automations: (state.automations ?? []).map((automation) =>
          automation.id === action.automationId
            ? setAutomationActions(automation, action.actions)
            : automation,
        ),
      }

    case 'automation/deleted': {
      if (state.automations === undefined) {
        return state
      }

      const automations = state.automations.filter(
        (automation) => automation.id !== action.automationId,
      )
      const next = { ...state }

      if (automations.length === 0) {
        delete next.automations
      } else {
        next.automations = automations
      }

      return next
    }

    case 'area/added':
      return {
        ...state,
        areas: [...(state.areas ?? []), action.area],
      }

    case 'area/nameChanged':
      return {
        ...state,
        areas: (state.areas ?? []).map((area) =>
          area.id === action.areaId ? renameArea(area, action.name) : area,
        ),
      }

    case 'area/moved':
      return {
        ...state,
        areas: moveItemWithinGroup(
          state.areas ?? [],
          action.areaId,
          action.direction,
          () => true,
        ),
      }

    case 'area/deleted':
      return {
        ...state,
        areas: (state.areas ?? []).filter((area) => area.id !== action.areaId),
        projects: state.projects.map((project) =>
          project.areaId === action.areaId
            ? moveProjectToArea(project, null)
            : project,
        ),
      }

    case 'customField/added':
      return {
        ...state,
        customFields: [...(state.customFields ?? []), action.field],
      }

    case 'customField/nameChanged':
      return {
        ...state,
        customFields: (state.customFields ?? []).map((field) =>
          field.id === action.fieldId
            ? renameCustomField(field, action.name)
            : field,
        ),
      }

    case 'customField/typeChanged': {
      const target = (state.customFields ?? []).find(
        (field) => field.id === action.fieldId,
      )

      if (!target) {
        throw new Error('Cannot change type of a missing custom field')
      }

      if (target.type === action.nextType) {
        return state
      }

      const migrated = migrateCustomFieldType(target, action.nextType)
      const remainsFormulaOperand =
        action.nextType === 'number' || action.nextType === 'formula'
      const customFields = (state.customFields ?? []).map((field) => {
        if (field.id === action.fieldId) {
          return migrated
        }

        if (
          remainsFormulaOperand ||
          field.type !== 'formula' ||
          field.formula === undefined ||
          (field.formula.leftFieldId !== action.fieldId &&
            field.formula.rightFieldId !== action.fieldId)
        ) {
          return field
        }

        return clearCustomFieldFormula(field)
      })

      validateCustomFieldFormulaDependencies(customFields)

      return {
        ...state,
        customFields,
        tasks: state.tasks.map((task) => {
          if (task.customFieldValues?.[action.fieldId] === undefined) {
            return task
          }

          const customFieldValues = { ...task.customFieldValues }
          delete customFieldValues[action.fieldId]
          const updated = { ...task }

          if (Object.keys(customFieldValues).length === 0) {
            delete updated.customFieldValues
          } else {
            updated.customFieldValues = customFieldValues
          }

          return updated
        }),
      }
    }

    case 'customField/formulaChanged': {
      const target = (state.customFields ?? []).find(
        (field) => field.id === action.fieldId,
      )

      if (!target) {
        throw new Error('Cannot configure a missing custom field')
      }

      const updated = action.formula === null
        ? clearCustomFieldFormula(target)
        : configureCustomFieldFormula(target, action.formula)
      const customFields = (state.customFields ?? []).map((field) =>
        field.id === action.fieldId ? updated : field,
      )

      if (action.formula !== null) {
        validateCustomFieldFormulaDependencies(customFields)
      }

      return {
        ...state,
        customFields,
      }
    }

    case 'customField/optionAdded': {
      if (!(state.customFields ?? []).some((field) => field.id === action.fieldId)) {
        throw new Error('Cannot change options on a missing custom field')
      }

      return {
        ...state,
        customFields: (state.customFields ?? []).map((field) =>
          field.id === action.fieldId
            ? addCustomFieldOption(field, action.option)
            : field,
        ),
      }
    }

    case 'customField/optionNameChanged': {
      if (!(state.customFields ?? []).some((field) => field.id === action.fieldId)) {
        throw new Error('Cannot change options on a missing custom field')
      }

      return {
        ...state,
        customFields: (state.customFields ?? []).map((field) =>
          field.id === action.fieldId
            ? renameCustomFieldOption(field, action.optionId, action.name)
            : field,
        ),
      }
    }

    case 'customField/optionDeleted': {
      const field = (state.customFields ?? []).find(
        (candidate) => candidate.id === action.fieldId,
      )

      if (!field) {
        throw new Error('Cannot change options on a missing custom field')
      }

      const updatedField = deleteCustomFieldOption(field, action.optionId)

      return {
        ...state,
        customFields: (state.customFields ?? []).map((candidate) =>
          candidate.id === action.fieldId ? updatedField : candidate,
        ),
        tasks: state.tasks.map((task) => {
          if (task.customFieldValues?.[action.fieldId] !== action.optionId) {
            return task
          }

          const customFieldValues = { ...task.customFieldValues }
          delete customFieldValues[action.fieldId]
          const updatedTask = { ...task }

          if (Object.keys(customFieldValues).length === 0) {
            delete updatedTask.customFieldValues
          } else {
            updatedTask.customFieldValues = customFieldValues
          }

          return updatedTask
        }),
      }
    }

    case 'customField/deleted': {
      const customFields = (state.customFields ?? [])
        .filter((field) => field.id !== action.fieldId)
        .map((field) => {
          if (
            field.type !== 'formula' ||
            field.formula === undefined ||
            (field.formula.leftFieldId !== action.fieldId &&
              field.formula.rightFieldId !== action.fieldId)
          ) {
            return field
          }

          return clearCustomFieldFormula(field)
        })
      const next: WorkspaceState = {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.customFieldValues === undefined) {
            return task
          }

          const customFieldValues = { ...task.customFieldValues }
          delete customFieldValues[action.fieldId]
          const updated = { ...task }

          if (Object.keys(customFieldValues).length === 0) {
            delete updated.customFieldValues
          } else {
            updated.customFieldValues = customFieldValues
          }

          return updated
        }),
      }

      if (customFields.length === 0) {
        delete next.customFields
      } else {
        next.customFields = customFields
      }

      return next
    }

    case 'person/added':
      return {
        ...state,
        people: [...(state.people ?? []), action.person],
      }

    case 'person/nameChanged':
      return {
        ...state,
        people: (state.people ?? []).map((person) =>
          person.id === action.personId
            ? renamePerson(person, action.name)
            : person,
        ),
      }

    case 'person/deleted': {
      const people = (state.people ?? []).filter(
        (person) => person.id !== action.personId,
      )
      const next: WorkspaceState = {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.assigneeIds === undefined) {
            return task
          }

          const assigneeIds = task.assigneeIds.filter(
            (personId) => personId !== action.personId,
          )
          const updated = { ...task }

          if (assigneeIds.length === 0) {
            delete updated.assigneeIds
          } else {
            updated.assigneeIds = assigneeIds
          }

          return updated
        }),
      }

      if (people.length === 0) {
        delete next.people
      } else {
        next.people = people
      }

      return next
    }

    case 'tag/added':
      return {
        ...state,
        tags: [...(state.tags ?? []), action.tag],
      }

    case 'tag/nameChanged':
      return {
        ...state,
        tags: (state.tags ?? []).map((tag) =>
          tag.id === action.tagId ? renameTag(tag, action.name) : tag,
        ),
      }

    case 'tag/deleted': {
      const tags = (state.tags ?? []).filter(
        (tag) => tag.id !== action.tagId,
      )
      const next: WorkspaceState = {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.tagIds === undefined) {
            return task
          }

          const tagIds = task.tagIds.filter(
            (tagId) => tagId !== action.tagId,
          )
          const updated = { ...task }

          if (tagIds.length === 0) {
            delete updated.tagIds
          } else {
            updated.tagIds = tagIds
          }

          return updated
        }),
      }

      if (tags.length === 0) {
        delete next.tags
      } else {
        next.tags = tags
      }

      return next
    }

    case 'list/added': {
      const projectExists = state.projects.some(
        (project) => project.id === action.list.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot add a list to a missing project')
      }

      return {
        ...state,
        lists: [...(state.lists ?? []), action.list],
      }
    }

    case 'list/nameChanged':
      return {
        ...state,
        lists: (state.lists ?? []).map((list) =>
          list.id === action.listId
            ? renameTaskList(list, action.name)
            : list,
        ),
      }

    case 'list/moved':
      return {
        ...state,
        lists: moveItemWithinGroup(
          state.lists ?? [],
          action.listId,
          action.direction,
          (candidate, target) =>
            candidate.projectId === target.projectId,
        ),
      }

    case 'list/deleted':
      return {
        ...state,
        lists: (state.lists ?? []).filter(
          (list) => list.id !== action.listId,
        ),
        tasks: state.tasks.map((task) => {
          if (task.listId !== action.listId) {
            return task
          }

          const next = { ...task }
          delete next.listId
          return next
        }),
      }

    case 'relationship/added': {
      if (
        action.relationship.sourceTaskId ===
        action.relationship.targetTaskId
      ) {
        throw new Error('A task cannot relate to itself')
      }

      const sourceExists = state.tasks.some(
        (task) => task.id === action.relationship.sourceTaskId,
      )
      const targetExists = state.tasks.some(
        (task) => task.id === action.relationship.targetTaskId,
      )

      if (!sourceExists || !targetExists) {
        throw new Error('Cannot relate a missing task')
      }

      const duplicate = (state.relationships ?? []).some((relationship) => {
        if (relationship.type !== action.relationship.type) {
          return false
        }

        if (relationship.type === 'related') {
          return (
            (relationship.sourceTaskId === action.relationship.sourceTaskId &&
              relationship.targetTaskId === action.relationship.targetTaskId) ||
            (relationship.sourceTaskId === action.relationship.targetTaskId &&
              relationship.targetTaskId === action.relationship.sourceTaskId)
          )
        }

        return (
          relationship.sourceTaskId === action.relationship.sourceTaskId &&
          relationship.targetTaskId === action.relationship.targetTaskId
        )
      })

      if (duplicate) {
        throw new Error('Cannot add a duplicate task relationship')
      }

      if (
        action.relationship.type === 'blocks' &&
        createsDependencyCycle(
          state.relationships ?? [],
          action.relationship.sourceTaskId,
          action.relationship.targetTaskId,
        )
      ) {
        throw new Error('Cannot create a dependency cycle')
      }

      return {
        ...state,
        relationships: [
          ...(state.relationships ?? []),
          action.relationship,
        ],
      }
    }

    case 'relationship/deleted': {
      const relationships = (state.relationships ?? []).filter(
        (relationship) => relationship.id !== action.relationshipId,
      )
      const next = { ...state }

      if (relationships.length === 0) {
        delete next.relationships
      } else {
        next.relationships = relationships
      }

      return next
    }

    case 'projectTemplate/added':
      return {
        ...state,
        projectTemplates: [
          ...(state.projectTemplates ?? []),
          action.template,
        ],
      }

    case 'projectTemplate/deleted': {
      const projectTemplates = (state.projectTemplates ?? []).filter(
        (template) => template.id !== action.templateId,
      )
      const next = { ...state }

      if (projectTemplates.length === 0) {
        delete next.projectTemplates
      } else {
        next.projectTemplates = projectTemplates
      }

      return next
    }

    case 'projectTemplate/instantiated':
      return {
        ...state,
        projects: [...state.projects, action.project],
        lists: [...(state.lists ?? []), ...action.lists],
        tasks: [...state.tasks, ...action.tasks],
      }

    case 'taskTemplate/added':
      return {
        ...state,
        taskTemplates: [...(state.taskTemplates ?? []), action.template],
      }

    case 'taskTemplate/deleted': {
      const taskTemplates = (state.taskTemplates ?? []).filter(
        (template) => template.id !== action.templateId,
      )
      const next = { ...state }

      if (taskTemplates.length === 0) {
        delete next.taskTemplates
      } else {
        next.taskTemplates = taskTemplates
      }

      return next
    }

    case 'taskTemplate/instantiated':
      return {
        ...state,
        tasks: [...state.tasks, ...action.tasks],
      }

    case 'project/added':
      return {
        ...state,
        projects: [...state.projects, action.project],
      }

    case 'project/archived':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? archiveProject(project, action.archivedAt)
            : project,
        ),
      }

    case 'project/restored':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? restoreProject(project)
            : project,
        ),
      }

    case 'project/nameChanged':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? renameProject(project, action.name)
            : project,
        ),
      }

    case 'project/descriptionChanged':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? setProjectDescription(project, action.description)
            : project,
        ),
      }

    case 'project/areaChanged': {
      if (
        action.areaId !== null &&
        !(state.areas ?? []).some((area) => area.id === action.areaId)
      ) {
        throw new Error('Cannot move a project to a missing area')
      }

      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? moveProjectToArea(project, action.areaId)
            : project,
        ),
      }
    }

    case 'project/moved':
      return {
        ...state,
        projects: moveItemWithinGroup(
          state.projects,
          action.projectId,
          action.direction,
          (candidate, target) =>
            candidate.areaId === target.areaId,
        ),
      }

    case 'project/deleted': {
      const deletedTaskIds = new Set(
        state.tasks
          .filter((task) => task.projectId === action.projectId)
          .map((task) => task.id),
      )
      const relationships = (state.relationships ?? []).filter(
        (relationship) =>
          !deletedTaskIds.has(relationship.sourceTaskId) &&
          !deletedTaskIds.has(relationship.targetTaskId),
      )
      const next: WorkspaceState = {
        ...state,
        projects: state.projects.filter(
          (project) => project.id !== action.projectId,
        ),
        tasks: state.tasks.filter(
          (task) => task.projectId !== action.projectId,
        ),
      }

      if (state.areas === undefined || state.areas.length === 0) {
        delete next.areas
      }

      if (state.lists === undefined || state.lists.length === 0) {
        delete next.lists
      } else {
        next.lists = state.lists.filter(
          (list) => list.projectId !== action.projectId,
        )
      }

      if (state.relationships !== undefined) {
        if (relationships.length === 0) {
          delete next.relationships
        } else {
          next.relationships = relationships
        }
      }

      return next
    }

    case 'task/added': {
      const projectExists = state.projects.some(
        (project) => project.id === action.task.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot add a task to a missing project')
      }

      if (action.task.parentTaskId !== undefined) {
        if (action.task.parentTaskId === action.task.id) {
          throw new Error('Cannot add a task as its own subtask')
        }

        const parent = state.tasks.find(
          (candidate) => candidate.id === action.task.parentTaskId,
        )

        if (!parent) {
          throw new Error('Cannot add a subtask to a missing parent task')
        }

        if (parent.projectId !== action.task.projectId) {
          throw new Error(
            'Cannot add a subtask to a parent from another project',
          )
        }
      }

      if (action.task.listId !== undefined) {
        const list = (state.lists ?? []).find(
          (candidate) => candidate.id === action.task.listId,
        )

        if (!list) {
          throw new Error('Cannot add a task to a missing list')
        }

        if (list.projectId !== action.task.projectId) {
          throw new Error('Cannot add a task to a list from another project')
        }
      }

      return {
        ...state,
        tasks: [...state.tasks, action.task],
      }
    }


    case 'task/archived': {
      const archivedIds = collectTaskSubtreeIds(state.tasks, action.taskId)

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          archivedIds.has(task.id)
            ? archiveTask(task, action.archivedAt)
            : task,
        ),
      }
    }

    case 'task/archivedBulk': {
      const archivedIds = new Set<string>()

      for (const taskId of action.taskIds) {
        for (const archivedId of collectTaskSubtreeIds(state.tasks, taskId)) {
          archivedIds.add(archivedId)
        }
      }

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          archivedIds.has(task.id)
            ? archiveTask(task, action.archivedAt)
            : task,
        ),
      }
    }

    case 'task/restored': {
      const restoredIds = collectTaskSubtreeIds(state.tasks, action.taskId)

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          restoredIds.has(task.id) ? restoreTask(task) : task,
        ),
      }
    }

    case 'task/statusChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, status: action.status }
            : task,
        ),
      }

    case 'task/recurringCompleted':
      return {
        ...state,
        tasks: [
          ...state.tasks.map((task) =>
            task.id === action.taskId ? { ...task, status: 'done' as const } : task,
          ),
          action.occurrence,
        ],
      }

    case 'task/recurrenceChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskRecurrence(task, action.recurrence)
            : task,
        ),
      }

    case 'task/timeEstimateChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskTimeEstimate(task, action.estimateMinutes)
            : task,
        ),
      }

    case 'task/timeTrackedManually':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? addTaskTrackedMinutes(task, {
                id: action.entryId,
                minutes: action.minutes,
                now: action.now,
              })
            : task,
        ),
      }

    case 'task/timerStarted':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? startTaskTimer(task, action.startedAt)
            : task,
        ),
      }

    case 'task/timerStopped':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? stopTaskTimer(task, {
                id: action.entryId,
                stoppedAt: action.stoppedAt,
              })
            : task,
        ),
      }

    case 'task/timeEntryDeleted':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? deleteTaskTimeEntry(task, action.entryId)
            : task,
        ),
      }

    case 'task/attachmentAdded':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? addTaskAttachment(task, {
                id: action.attachmentId,
                name: action.name,
                sizeBytes: action.sizeBytes,
                mediaType: action.mediaType,
                now: action.now,
              })
            : task,
        ),
      }

    case 'task/attachmentDeleted':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? deleteTaskAttachment(task, action.attachmentId)
            : task,
        ),
      }

    case 'task/statusChangedBulk': {
      const taskIds = new Set(action.taskIds)

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          taskIds.has(task.id)
            ? { ...task, status: action.status }
            : task,
        ),
      }
    }

    case 'task/titleChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? renameTask(task, action.title) : task,
        ),
      }

    case 'task/priorityChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, priority: action.priority }
            : task,
        ),
      }

    case 'task/priorityChangedBulk': {
      const taskIds = new Set(action.taskIds)

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          taskIds.has(task.id)
            ? { ...task, priority: action.priority }
            : task,
        ),
      }
    }

    case 'task/startDateChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskStartDate(task, action.startDate)
            : task,
        ),
      }

    case 'task/dueDateChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskDueDate(task, action.dueDate)
            : task,
        ),
      }

    case 'task/descriptionChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskDescription(task, action.description)
            : task,
        ),
      }

    case 'task/projectChanged': {
      const projectExists = state.projects.some(
        (project) => project.id === action.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot move a task to a missing project')
      }

      const targetTask = state.tasks.find(
        (task) => task.id === action.taskId,
      )

      if (!targetTask) {
        return state
      }

      if (
        targetTask.parentTaskId !== undefined &&
        targetTask.projectId !== action.projectId
      ) {
        throw new Error(
          'Cannot move a subtask away from its parent project',
        )
      }

      const movedIds = new Set([targetTask.id])

      let changed = true
      while (changed) {
        changed = false

        for (const task of state.tasks) {
          if (
            task.parentTaskId !== undefined &&
            movedIds.has(task.parentTaskId) &&
            !movedIds.has(task.id)
          ) {
            movedIds.add(task.id)
            changed = true
          }
        }
      }

      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (!movedIds.has(task.id)) {
            return task
          }

          const moved = moveTaskToProject(task, action.projectId)

          return task.projectId === action.projectId
            ? moved
            : setTaskList(moved, null)
        }),
      }
    }

    case 'task/listChanged': {
      const task = state.tasks.find((candidate) => candidate.id === action.taskId)

      if (!task) {
        return state
      }

      if (action.listId !== null) {
        const list = (state.lists ?? []).find(
          (candidate) => candidate.id === action.listId,
        )

        if (!list) {
          throw new Error('Cannot assign a task to a missing list')
        }

        if (list.projectId !== task.projectId) {
          throw new Error('Cannot assign a task to a list from another project')
        }
      }

      return {
        ...state,
        tasks: state.tasks.map((candidate) =>
          candidate.id === action.taskId
            ? setTaskList(candidate, action.listId)
            : candidate,
        ),
      }
    }

    case 'task/moved':
      return {
        ...state,
        tasks: moveItemWithinGroup(
          state.tasks,
          action.taskId,
          action.direction,
          (candidate, target) =>
            candidate.projectId === target.projectId &&
            candidate.listId === target.listId &&
            candidate.parentTaskId === target.parentTaskId,
        ),
      }

    case 'task/customFieldValueChanged': {
      const targetTask = state.tasks.find(
        (task) => task.id === action.taskId,
      )

      if (!targetTask) {
        throw new Error('Cannot set a custom field on a missing task')
      }

      const field = (state.customFields ?? []).find(
        (candidate) => candidate.id === action.fieldId,
      )

      if (!field) {
        throw new Error('Cannot set a missing custom field')
      }

      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId) {
            return task
          }

          const customFieldValues = {
            ...task.customFieldValues,
          }

          if (action.value === null) {
            delete customFieldValues[action.fieldId]
          } else {
            customFieldValues[action.fieldId] =
              normalizeCustomFieldValueForDefinition(field, action.value)
          }

          const next = { ...task }

          if (Object.keys(customFieldValues).length === 0) {
            delete next.customFieldValues
          } else {
            next.customFieldValues = customFieldValues
          }

          return next
        }),
      }
    }

    case 'task/assigneeAdded': {
      const taskExists = state.tasks.some(
        (task) => task.id === action.taskId,
      )

      if (!taskExists) {
        throw new Error('Cannot assign a missing task')
      }

      const personExists = (state.people ?? []).some(
        (person) => person.id === action.personId,
      )

      if (!personExists) {
        throw new Error('Cannot assign a missing person')
      }

      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId) {
            return task
          }

          if ((task.assigneeIds ?? []).includes(action.personId)) {
            return task
          }

          return {
            ...task,
            assigneeIds: [
              ...(task.assigneeIds ?? []),
              action.personId,
            ],
          }
        }),
      }
    }

    case 'task/assigneeRemoved':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (
            task.id !== action.taskId ||
            task.assigneeIds === undefined
          ) {
            return task
          }

          const assigneeIds = task.assigneeIds.filter(
            (personId) => personId !== action.personId,
          )
          const next = { ...task }

          if (assigneeIds.length === 0) {
            delete next.assigneeIds
          } else {
            next.assigneeIds = assigneeIds
          }

          return next
        }),
      }

    case 'task/tagAdded': {
      const taskExists = state.tasks.some(
        (task) => task.id === action.taskId,
      )

      if (!taskExists) {
        throw new Error('Cannot tag a missing task')
      }

      const tagExists = (state.tags ?? []).some(
        (tag) => tag.id === action.tagId,
      )

      if (!tagExists) {
        throw new Error('Cannot assign a missing tag')
      }

      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId) {
            return task
          }

          if ((task.tagIds ?? []).includes(action.tagId)) {
            return task
          }

          return {
            ...task,
            tagIds: [...(task.tagIds ?? []), action.tagId],
          }
        }),
      }
    }

    case 'task/tagRemoved':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId || task.tagIds === undefined) {
            return task
          }

          const tagIds = task.tagIds.filter(
            (tagId) => tagId !== action.tagId,
          )
          const next = { ...task }

          if (tagIds.length === 0) {
            delete next.tagIds
          } else {
            next.tagIds = tagIds
          }

          return next
        }),
      }

    case 'task/checklistItemAdded': {
      const target = state.tasks.find((task) => task.id === action.taskId)

      if (!target) {
        throw new Error('Cannot add a checklist item to a missing task')
      }

      if (
        (target.checklist ?? []).some(
          (item) => item.id === action.item.id,
        )
      ) {
        throw new Error('Cannot add a duplicate checklist item')
      }

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: [...(task.checklist ?? []), action.item],
              }
            : task,
        ),
      }
    }

    case 'task/checklistItemTextChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: (task.checklist ?? []).map((item) =>
                  item.id === action.itemId
                    ? renameChecklistItem(item, action.text)
                    : item,
                ),
              }
            : task,
        ),
      }

    case 'task/checklistItemCompletedChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: (task.checklist ?? []).map((item) =>
                  item.id === action.itemId
                    ? setChecklistItemCompleted(
                        item,
                        action.completed,
                      )
                    : item,
                ),
              }
            : task,
        ),
      }

    case 'task/checklistItemMoved':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId && task.checklist !== undefined
            ? {
                ...task,
                checklist: moveItemWithinGroup(
                  task.checklist,
                  action.itemId,
                  action.direction,
                  () => true,
                ),
              }
            : task,
        ),
      }

    case 'task/checklistItemDeleted':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId || task.checklist === undefined) {
            return task
          }

          const checklist = task.checklist.filter(
            (item) => item.id !== action.itemId,
          )
          const next = { ...task }

          if (checklist.length === 0) {
            delete next.checklist
          } else {
            next.checklist = checklist
          }

          return next
        }),
      }

    case 'task/deleted': {
      const deletedIds = collectTaskSubtreeIds(state.tasks, action.taskId)

      const relationships = (state.relationships ?? []).filter(
        (relationship) =>
          !deletedIds.has(relationship.sourceTaskId) &&
          !deletedIds.has(relationship.targetTaskId),
      )
      const next: WorkspaceState = {
        ...state,
        tasks: state.tasks.filter((task) => !deletedIds.has(task.id)),
      }

      if (state.relationships !== undefined) {
        if (relationships.length === 0) {
          delete next.relationships
        } else {
          next.relationships = relationships
        }
      }

      return next
    }
  }
}

export { deriveTaskActivityEntries, describeTaskActivityEntry } from './task-activity'
