import { useState, useSyncExternalStore } from 'react'

import { App } from './App'
import { AutomationPanel } from './AutomationPanel'
import type { WorkspaceCommands } from './application/workspace-commands'
import type { WorkspaceStore } from './application/workspace-store'
import type { ViewPreferences } from './domain/view-preferences'

function commandErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Workspace command failed'
}

export interface WorkspaceRootProps {
  store: WorkspaceStore
  commands: WorkspaceCommands
  initialViewPreferences?: ViewPreferences
  onViewPreferencesChange?: (preferences: ViewPreferences) => void
}

export function WorkspaceRoot({
  store,
  commands,
  initialViewPreferences,
  onViewPreferencesChange,
}: WorkspaceRootProps) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  )
  const [commandError, setCommandError] = useState<string | null>(null)

  function runCommand<T>(command: () => T): T | undefined {
    try {
      const result = command()
      setCommandError(null)
      return result
    } catch (error) {
      setCommandError(commandErrorMessage(error))
      return undefined
    }
  }

  const guardedCommands = new Proxy(commands, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== 'function') return value

      return (...args: unknown[]) =>
        runCommand(() => (value as (...callArgs: unknown[]) => unknown)(...args))
    },
  }) as WorkspaceCommands

  return (
    <>
      {commandError ? <p role="alert">{commandError}</p> : null}
      <AutomationPanel
        state={state}
        onAddAutomation={(name, input) => guardedCommands.addAutomation(name, input)}
        onRenameAutomation={(automationId, name) =>
          guardedCommands.renameAutomation(automationId, name)
        }
        onSetAutomationEnabled={(automationId, enabled) =>
          guardedCommands.setAutomationEnabled(automationId, enabled)
        }
        onChangeAutomationTrigger={(automationId, trigger) =>
          guardedCommands.changeAutomationTrigger(automationId, trigger)
        }
        onChangeAutomationConditions={(automationId, conditions) =>
          guardedCommands.changeAutomationConditions(automationId, conditions)
        }
        onChangeAutomationActions={(automationId, actions) =>
          guardedCommands.changeAutomationActions(automationId, actions)
        }
        onDeleteAutomation={(automationId) => guardedCommands.deleteAutomation(automationId)}
      />
      <App
      state={state}
      initialViewPreferences={initialViewPreferences}
      onViewPreferencesChange={onViewPreferencesChange}
      onCreateTaskRelationship={(type, sourceTaskId, targetTaskId) => {
        guardedCommands.addTaskRelationship(type, sourceTaskId, targetTaskId)
      }}
      onDeleteTaskRelationship={(relationshipId) => {
        guardedCommands.deleteTaskRelationship(relationshipId)
      }}
      onCreateCustomField={(name, type) => {
        guardedCommands.addCustomField(name, type)
      }}
      onRenameCustomField={(fieldId, name) => {
        guardedCommands.renameCustomField(fieldId, name)
      }}
      onChangeCustomFieldType={(fieldId, nextType) => {
        guardedCommands.changeCustomFieldType(fieldId, nextType)
      }}
      onDeleteCustomField={(fieldId) => {
        guardedCommands.deleteCustomField(fieldId)
      }}
      onConfigureCustomFieldFormula={(fieldId, formula) => {
        guardedCommands.configureCustomFieldFormula(fieldId, formula)
      }}
      onAddCustomFieldOption={(fieldId, name) => {
        guardedCommands.addCustomFieldOption(fieldId, name)
      }}
      onRenameCustomFieldOption={(fieldId, optionId, name) => {
        guardedCommands.renameCustomFieldOption(fieldId, optionId, name)
      }}
      onDeleteCustomFieldOption={(fieldId, optionId) => {
        guardedCommands.deleteCustomFieldOption(fieldId, optionId)
      }}
      onChangeTaskCustomFieldValue={(taskId, fieldId, value) => {
        guardedCommands.changeTaskCustomFieldValue(taskId, fieldId, value)
      }}
      onCreatePerson={(name) => {
        guardedCommands.addPerson(name)
      }}
      onRenamePerson={(personId, name) => {
        guardedCommands.renamePerson(personId, name)
      }}
      onDeletePerson={(personId) => {
        guardedCommands.deletePerson(personId)
      }}
      onChangeTaskAssignee={(taskId, personId, assigned) => {
        if (assigned) {
          guardedCommands.assignTaskAssignee(taskId, personId)
        } else {
          guardedCommands.removeTaskAssignee(taskId, personId)
        }
      }}
      onCreateTag={(name) => {
        guardedCommands.addTag(name)
      }}
      onRenameTag={(tagId, name) => {
        guardedCommands.renameTag(tagId, name)
      }}
      onDeleteTag={(tagId) => {
        guardedCommands.deleteTag(tagId)
      }}
      onChangeTaskTag={(taskId, tagId, assigned) => {
        if (assigned) {
          guardedCommands.assignTaskTag(taskId, tagId)
        } else {
          guardedCommands.removeTaskTag(taskId, tagId)
        }
      }}
      onCreateArea={(name) => {
        guardedCommands.addArea(name)
      }}
      onRenameArea={(areaId, name) => {
        guardedCommands.renameArea(areaId, name)
      }}
      onDeleteArea={(areaId) => {
        guardedCommands.deleteArea(areaId)
      }}
      onMoveArea={(areaId, direction) => {
        guardedCommands.moveArea(areaId, direction)
      }}
      onChangeProjectArea={(projectId, areaId) => {
        guardedCommands.changeProjectArea(projectId, areaId)
      }}
      onCreateTaskList={(projectId, name) => {
        guardedCommands.addTaskList(projectId, name)
      }}
      onRenameTaskList={(listId, name) => {
        guardedCommands.renameTaskList(listId, name)
      }}
      onDeleteTaskList={(listId) => {
        guardedCommands.deleteTaskList(listId)
      }}
      onMoveTaskList={(listId, direction) => {
        guardedCommands.moveTaskList(listId, direction)
      }}
      onChangeTaskList={(taskId, listId) => {
        guardedCommands.changeTaskList(taskId, listId)
      }}
      onAddChecklistItem={(taskId, text) => {
        guardedCommands.addChecklistItem(taskId, text)
      }}
      onRenameChecklistItem={(taskId, itemId, text) => {
        guardedCommands.renameChecklistItem(taskId, itemId, text)
      }}
      onChangeChecklistItemCompleted={(taskId, itemId, completed) => {
        guardedCommands.changeChecklistItemCompleted(taskId, itemId, completed)
      }}
      onDeleteChecklistItem={(taskId, itemId) => {
        guardedCommands.deleteChecklistItem(taskId, itemId)
      }}
      onMoveChecklistItem={(taskId, itemId, direction) => {
        guardedCommands.moveChecklistItem(taskId, itemId, direction)
      }}
      onMoveProject={(projectId, direction) => {
        guardedCommands.moveProject(projectId, direction)
      }}
      onCreateProject={(name) => {
        guardedCommands.addProject(name)
      }}
      onSaveProjectTemplate={(projectId, name) => {
        guardedCommands.saveProjectTemplate(projectId, name)
      }}
      onCreateProjectFromTemplate={(templateId) => {
        guardedCommands.createProjectFromTemplate(templateId)
      }}
      onDeleteProjectTemplate={(templateId) => {
        guardedCommands.deleteProjectTemplate(templateId)
      }}
      onSaveTaskTemplate={(taskId, name) => {
        guardedCommands.saveTaskTemplate(taskId, name)
      }}
      onCreateTaskFromTemplate={(templateId, projectId, listId) => {
        guardedCommands.createTaskFromTemplate(templateId, projectId, listId)
      }}
      onDeleteTaskTemplate={(templateId) => {
        guardedCommands.deleteTaskTemplate(templateId)
      }}
      onArchiveProject={(projectId) => {
        guardedCommands.archiveProject(projectId)
      }}
      onRestoreProject={(projectId) => {
        guardedCommands.restoreProject(projectId)
      }}
      onRenameProject={(projectId, name) => {
        guardedCommands.renameProject(projectId, name)
      }}
      onChangeProjectDescription={(projectId, description) => {
        guardedCommands.changeProjectDescription(projectId, description)
      }}
      onCreateTask={(projectId, title, listId) => {
        guardedCommands.addTask(projectId, title, listId)
      }}
      onCreateSubtask={(parentTaskId, title) => {
        guardedCommands.addSubtask(parentTaskId, title)
      }}
      onDuplicateTask={(taskId) => {
        guardedCommands.duplicateTask(taskId)
      }}
      onArchiveTask={(taskId) => {
        guardedCommands.archiveTask(taskId)
      }}
      onArchiveTasks={(taskIds) => {
        guardedCommands.archiveTasks(taskIds)
      }}
      onRestoreTask={(taskId) => {
        guardedCommands.restoreTask(taskId)
      }}
      onDeleteProject={(projectId) => {
        guardedCommands.deleteProject(projectId)
      }}
      onRenameTask={(taskId, title) => {
        guardedCommands.renameTask(taskId, title)
      }}
      onDeleteTask={(taskId) => {
        guardedCommands.deleteTask(taskId)
      }}
      onMoveTask={(taskId, direction) => {
        guardedCommands.moveTask(taskId, direction)
      }}
      onChangeTaskStatus={(taskId, status) => {
        guardedCommands.changeTaskStatus(taskId, status)
      }}
      onChangeTaskRecurrence={(taskId, recurrence) => {
        guardedCommands.changeTaskRecurrence(taskId, recurrence)
      }}
      onChangeTaskTimeEstimate={(taskId, estimateMinutes) => {
        guardedCommands.changeTaskTimeEstimate(taskId, estimateMinutes)
      }}
      onAddTaskTrackedMinutes={(taskId, minutes) => {
        guardedCommands.addTaskTrackedMinutes(taskId, minutes)
      }}
      onStartTaskTimer={(taskId) => {
        guardedCommands.startTaskTimer(taskId)
      }}
      onStopTaskTimer={(taskId) => {
        guardedCommands.stopTaskTimer(taskId)
      }}
      onDeleteTaskTimeEntry={(taskId, entryId) => {
        guardedCommands.deleteTaskTimeEntry(taskId, entryId)
      }}
      onAddTaskAttachment={(taskId, input) => {
        guardedCommands.addTaskAttachment(taskId, input)
      }}
      onDeleteTaskAttachment={(taskId, attachmentId) => {
        guardedCommands.deleteTaskAttachment(taskId, attachmentId)
      }}
      onChangeTasksStatus={(taskIds, status) => {
        guardedCommands.changeTasksStatus(taskIds, status)
      }}
      onChangeTaskPriority={(taskId, priority) => {
        guardedCommands.changeTaskPriority(taskId, priority)
      }}
      onChangeTasksPriority={(taskIds, priority) => {
        guardedCommands.changeTasksPriority(taskIds, priority)
      }}
      onChangeTaskStartDate={(taskId, startDate) => {
        guardedCommands.changeTaskStartDate(taskId, startDate)
      }}
      onChangeTaskDueDate={(taskId, dueDate) => {
        guardedCommands.changeTaskDueDate(taskId, dueDate)
      }}
      onChangeTaskDescription={(taskId, description) => {
        guardedCommands.changeTaskDescription(taskId, description)
      }}
      onChangeTaskProject={(taskId, projectId) => {
        guardedCommands.changeTaskProject(taskId, projectId)
      }}
      />
    </>
  )
}
