import { useSyncExternalStore } from 'react'

import { App } from './App'
import type { WorkspaceCommands } from './application/workspace-commands'
import type { WorkspaceStore } from './application/workspace-store'

export interface WorkspaceRootProps {
  store: WorkspaceStore
  commands: WorkspaceCommands
}

export function WorkspaceRoot({
  store,
  commands,
}: WorkspaceRootProps) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  )

  return (
    <App
      state={state}
      onCreateProject={(name) => {
        commands.addProject(name)
      }}
      onRenameProject={(projectId, name) => {
        commands.renameProject(projectId, name)
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
    />
  )
}
