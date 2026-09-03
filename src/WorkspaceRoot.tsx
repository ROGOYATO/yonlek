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
      onCreateProject={(name) => {
        commands.addProject(name)
      }}
      onRenameProject={(projectId, name) => {
        commands.renameProject(projectId, name)
      }}
      onChangeProjectDescription={(projectId, description) => {
        commands.changeProjectDescription(projectId, description)
      }}
      onCreateTask={(projectId, title) => {
        commands.addTask(projectId, title)
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
      onChangeTaskStatus={(taskId, status) => {
        commands.changeTaskStatus(taskId, status)
      }}
      onChangeTaskPriority={(taskId, priority) => {
        commands.changeTaskPriority(taskId, priority)
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
