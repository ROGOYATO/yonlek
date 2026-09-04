import type { Task } from './task'
import type { TaskList } from './task-list'

export type TaskGroup = 'none' | 'status' | 'priority' | 'list'

export interface TaskGroupBucket {
  key: string
  label: string
  tasks: Task[]
}

function nonEmptyGroup(
  key: string,
  label: string,
  tasks: Task[],
): TaskGroupBucket | null {
  return tasks.length === 0 ? null : { key, label, tasks }
}

export function groupTasks(
  tasks: Task[],
  group: TaskGroup,
  lists: TaskList[] = [],
): TaskGroupBucket[] {
  if (tasks.length === 0) {
    return []
  }

  if (group === 'none') {
    return [{ key: 'all', label: 'All tasks', tasks: [...tasks] }]
  }

  if (group === 'status') {
    return [
      nonEmptyGroup('todo', 'To do', tasks.filter((task) => task.status === 'todo')),
      nonEmptyGroup('doing', 'Doing', tasks.filter((task) => task.status === 'doing')),
      nonEmptyGroup('done', 'Done', tasks.filter((task) => task.status === 'done')),
    ].filter((bucket): bucket is TaskGroupBucket => bucket !== null)
  }

  if (group === 'priority') {
    return [
      nonEmptyGroup('high', 'High', tasks.filter((task) => task.priority === 'high')),
      nonEmptyGroup(
        'normal',
        'Normal',
        tasks.filter((task) => task.priority === 'normal'),
      ),
      nonEmptyGroup('low', 'Low', tasks.filter((task) => task.priority === 'low')),
    ].filter((bucket): bucket is TaskGroupBucket => bucket !== null)
  }

  const listIds = new Set(lists.map((list) => list.id))
  const listGroups = lists
    .map((list) =>
      nonEmptyGroup(
        list.id,
        list.name,
        tasks.filter((task) => task.listId === list.id),
      ),
    )
    .filter((bucket): bucket is TaskGroupBucket => bucket !== null)
  const noList = nonEmptyGroup(
    'no-list',
    'No list',
    tasks.filter(
      (task) => task.listId === undefined || !listIds.has(task.listId),
    ),
  )

  return noList === null ? listGroups : [...listGroups, noList]
}
