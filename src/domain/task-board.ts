import type { Task, TaskStatus } from './task'

export interface TaskBoardColumn {
  key: TaskStatus
  label: string
  tasks: Task[]
}

const BOARD_COLUMNS: Array<Pick<TaskBoardColumn, 'key' | 'label'>> = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
]

export function createTaskBoardColumns(tasks: Task[]): TaskBoardColumn[] {
  return BOARD_COLUMNS.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.key),
  }))
}
