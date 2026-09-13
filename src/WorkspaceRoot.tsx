import { useSyncExternalStore } from 'react'

import { App } from './App'
import type { WorkspaceCommands } from './application/workspace-commands'
import type { WorkspaceStore } from './application/workspace-store'
import type { ViewPreferences } from './domain/view-preferences'

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

  return (
    <App
      state={state}
      initialViewPreferences={initialViewPreferences}
      onViewPreferencesChange={onViewPreferencesChange}
      onCreateTaskRelationship={(type, sourceTaskId, targetTaskId) => {
        commands.addTaskRelationship(type, sourceTaskId, targetTaskId)
      }}
      onDeleteTaskRelationship={(relationshipId) => {
        commands.deleteTaskRelationship(relationshipId)
      }}
      onCreateCustomField={(name, type) => {
        commands.addCustomField(name, type)
      }}
      onRenameCustomField={(fieldId, name) => {
        commands.renameCustomField(fieldId, name)
      }}
      onChangeCustomFieldType={(fieldId, nextType) => {
        commands.changeCustomFieldType(fieldId, nextType)
      }}
      onDeleteCustomField={(fieldId) => {
        commands.deleteCustomField(fieldId)
      }}
      onConfigureCustomFieldFormula={(fieldId, formula) => {
        commands.configureCustomFieldFormula(fieldId, formula)
      }}
      onAddCustomFieldOption={(fieldId, name) => {
        commands.addCustomFieldOption(fieldId, name)
      }}
      onRenameCustomFieldOption={(fieldId, optionId, name) => {
        commands.renameCustomFieldOption(fieldId, optionId, name)
      }}
      onDeleteCustomFieldOption={(fieldId, optionId) => {
        commands.deleteCustomFieldOption(fieldId, optionId)
      }}
      onChangeTaskCustomFieldValue={(taskId, fieldId, value) => {
        commands.changeTaskCustomFieldValue(taskId, fieldId, value)
      }}
      onCreatePerson={(name) => {
        commands.addPerson(name)
      }}
      onRenamePerson={(personId, name) => {
        commands.renamePerson(personId, name)
      }}
      onDeletePerson={(personId) => {
        commands.deletePerson(personId)
      }}
      onChangeTaskAssignee={(taskId, personId, assigned) => {
        if (assigned) {
          commands.assignTaskAssignee(taskId, personId)
        } else {
          commands.removeTaskAssignee(taskId, personId)
        }
      }}
      onCreateTag={(name) => {
        commands.addTag(name)
      }}
      onRenameTag={(tagId, name) => {
        commands.renameTag(tagId, name)
      }}
      onDeleteTag={(tagId) => {
        commands.deleteTag(tagId)
      }}
      onChangeTaskTag={(taskId, tagId, assigned) => {
        if (assigned) {
          commands.assignTaskTag(taskId, tagId)
        } else {
          commands.removeTaskTag(taskId, tagId)
        }
      }}
      onCreateArea={(name) => {
        commands.addArea(name)
      }}
      onRenameArea={(areaId, name) => {
        commands.renameArea(areaId, name)
      }}
      onDeleteArea={(areaId) => {
        commands.deleteArea(areaId)
      }}
      onMoveArea={(areaId, direction) => {
        commands.moveArea(areaId, direction)
      }}
      onChangeProjectArea={(projectId, areaId) => {
        commands.changeProjectArea(projectId, areaId)
      }}
      onCreateTaskList={(projectId, name) => {
        commands.addTaskList(projectId, name)
      }}
      onRenameTaskList={(listId, name) => {
        commands.renameTaskList(listId, name)
      }}
      onDeleteTaskList={(listId) => {
        commands.deleteTaskList(listId)
      }}
      onMoveTaskList={(listId, direction) => {
        commands.moveTaskList(listId, direction)
      }}
      onChangeTaskList={(taskId, listId) => {
        commands.changeTaskList(taskId, listId)
      }}
      onAddChecklistItem={(taskId, text) => {
        commands.addChecklistItem(taskId, text)
      }}
      onRenameChecklistItem={(taskId, itemId, text) => {
        commands.renameChecklistItem(taskId, itemId, text)
      }}
      onChangeChecklistItemCompleted={(taskId, itemId, completed) => {
        commands.changeChecklistItemCompleted(taskId, itemId, completed)
      }}
      onDeleteChecklistItem={(taskId, itemId) => {
        commands.deleteChecklistItem(taskId, itemId)
      }}
      onMoveChecklistItem={(taskId, itemId, direction) => {
        commands.moveChecklistItem(taskId, itemId, direction)
      }}
      onMoveProject={(projectId, direction) => {
        commands.moveProject(projectId, direction)
      }}
      onCreateProject={(name) => {
        commands.addProject(name)
      }}
      onSaveProjectTemplate={(projectId, name) => {
        commands.saveProjectTemplate(projectId, name)
      }}
      onCreateProjectFromTemplate={(templateId) => {
        commands.createProjectFromTemplate(templateId)
      }}
      onDeleteProjectTemplate={(templateId) => {
        commands.deleteProjectTemplate(templateId)
      }}
      onSaveTaskTemplate={(taskId, name) => {
        commands.saveTaskTemplate(taskId, name)
      }}
      onCreateTaskFromTemplate={(templateId, projectId, listId) => {
        commands.createTaskFromTemplate(templateId, projectId, listId)
      }}
      onDeleteTaskTemplate={(templateId) => {
        commands.deleteTaskTemplate(templateId)
      }}
      onArchiveProject={(projectId) => {
        commands.archiveProject(projectId)
      }}
      onRestoreProject={(projectId) => {
        commands.restoreProject(projectId)
      }}
      onRenameProject={(projectId, name) => {
        commands.renameProject(projectId, name)
      }}
      onChangeProjectDescription={(projectId, description) => {
        commands.changeProjectDescription(projectId, description)
      }}
      onCreateTask={(projectId, title, listId) => {
        commands.addTask(projectId, title, listId)
      }}
      onCreateSubtask={(parentTaskId, title) => {
        commands.addSubtask(parentTaskId, title)
      }}
      onDuplicateTask={(taskId) => {
        commands.duplicateTask(taskId)
      }}
      onArchiveTask={(taskId) => {
        commands.archiveTask(taskId)
      }}
      onArchiveTasks={(taskIds) => {
        commands.archiveTasks(taskIds)
      }}
      onRestoreTask={(taskId) => {
        commands.restoreTask(taskId)
      }}
      onDeleteProject={(projectId) => {
        commands.deleteProject(projectId)
      }}
      onRenameTask={(taskId, title) => {
        commands.renameTask(taskId, title)
      }}
      onDeleteTask={(taskId) => {
        commands.deleteTask(taskId)
      }}
      onMoveTask={(taskId, direction) => {
        commands.moveTask(taskId, direction)
      }}
      onChangeTaskStatus={(taskId, status) => {
        commands.changeTaskStatus(taskId, status)
      }}
      onChangeTasksStatus={(taskIds, status) => {
        commands.changeTasksStatus(taskIds, status)
      }}
      onChangeTaskPriority={(taskId, priority) => {
        commands.changeTaskPriority(taskId, priority)
      }}
      onChangeTasksPriority={(taskIds, priority) => {
        commands.changeTasksPriority(taskIds, priority)
      }}
      onChangeTaskStartDate={(taskId, startDate) => {
        commands.changeTaskStartDate(taskId, startDate)
      }}
      onChangeTaskDueDate={(taskId, dueDate) => {
        commands.changeTaskDueDate(taskId, dueDate)
      }}
      onChangeTaskDescription={(taskId, description) => {
        commands.changeTaskDescription(taskId, description)
      }}
      onChangeTaskProject={(taskId, projectId) => {
        commands.changeTaskProject(taskId, projectId)
      }}
    />
  )
}
