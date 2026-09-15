import { describe, expect, it } from 'vitest'

import { createProjectTemplate, instantiateProjectTemplate } from './project-template'
import {
  addTaskTrackedMinutes,
  createNextRecurringTaskOccurrence,
  createTask,
  duplicateTask,
  setTaskDueDate,
  setTaskRecurrence,
  setTaskTimeEstimate,
  startTaskTimer,
} from './task'
import { createTaskTemplate, instantiateTaskTemplate } from './task-template'

function trackedTask() {
  const source = setTaskTimeEstimate(
    createTask({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Tracked source',
      now: '2026-09-15T09:00:00.000Z',
    }),
    60,
  )
  const withEntry = addTaskTrackedMinutes(source, {
    id: 'entry-1',
    minutes: 25,
    now: '2026-09-15T10:00:00.000Z',
  })
  return startTaskTimer(withEntry, '2026-09-15T11:00:00.000Z')
}

describe('Task time-tracking copy boundaries', () => {
  it('does not copy actual tracked work into duplicates or recurring occurrences', () => {
    const source = trackedTask()

    const duplicate = duplicateTask(source, {
      id: 'task-2',
      now: '2026-09-15T12:00:00.000Z',
    })
    expect(duplicate.estimateMinutes).toBe(60)
    expect(duplicate).not.toHaveProperty('timeEntries')
    expect(duplicate).not.toHaveProperty('timerStartedAt')

    const recurring = setTaskRecurrence(
      setTaskDueDate({ ...source, status: 'done' }, '2026-09-16'),
      { unit: 'day', interval: 1 },
    )
    const occurrence = createNextRecurringTaskOccurrence(recurring, {
      id: 'task-3',
      now: '2026-09-16T12:00:00.000Z',
    })
    expect(occurrence.estimateMinutes).toBe(60)
    expect(occurrence).not.toHaveProperty('timeEntries')
    expect(occurrence).not.toHaveProperty('timerStartedAt')
  })

  it('keeps actual tracked work out of Task and Project Templates', () => {
    const source = trackedTask()
    const taskTemplate = createTaskTemplate({
      id: 'task-template-1',
      name: 'Reusable Task',
      now: '2026-09-15T12:00:00.000Z',
      rootTask: source,
      tasks: [source],
    })
    expect(taskTemplate.tasks[0]).not.toHaveProperty('timeEntries')
    expect(taskTemplate.tasks[0]).not.toHaveProperty('timerStartedAt')

    let taskId = 0
    const taskInstance = instantiateTaskTemplate(taskTemplate, {
      projectId: 'project-2',
      now: '2026-09-15T13:00:00.000Z',
      nextId: () => `task-copy-${++taskId}`,
    })
    expect(taskInstance.rootTask.estimateMinutes).toBe(60)
    expect(taskInstance.rootTask).not.toHaveProperty('timeEntries')
    expect(taskInstance.rootTask).not.toHaveProperty('timerStartedAt')

    const projectTemplate = createProjectTemplate({
      id: 'project-template-1',
      name: 'Reusable Project',
      now: '2026-09-15T12:00:00.000Z',
      project: {
        id: 'project-1',
        name: 'Project',
        createdAt: '2026-09-15T09:00:00.000Z',
      },
      lists: [],
      tasks: [source],
    })
    expect(projectTemplate.tasks[0]).not.toHaveProperty('timeEntries')
    expect(projectTemplate.tasks[0]).not.toHaveProperty('timerStartedAt')

    let projectId = 0
    const projectInstance = instantiateProjectTemplate(projectTemplate, {
      now: '2026-09-15T13:00:00.000Z',
      nextId: () => `project-copy-${++projectId}`,
    })
    expect(projectInstance.tasks[0]?.estimateMinutes).toBe(60)
    expect(projectInstance.tasks[0]).not.toHaveProperty('timeEntries')
    expect(projectInstance.tasks[0]).not.toHaveProperty('timerStartedAt')
  })
})
