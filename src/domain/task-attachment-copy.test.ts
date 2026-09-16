import { describe, expect, it } from 'vitest'

import { createProjectTemplate, instantiateProjectTemplate } from './project-template'
import {
  addTaskAttachment,
  createNextRecurringTaskOccurrence,
  createTask,
  duplicateTask,
  setTaskDueDate,
  setTaskRecurrence,
  setTaskTimeEstimate,
} from './task'
import { createTaskTemplate, instantiateTaskTemplate } from './task-template'

function attachedTask() {
  const estimated = setTaskTimeEstimate(
    createTask({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Attached source',
      now: '2026-09-16T08:00:00.000Z',
    }),
    45,
  )

  return addTaskAttachment(estimated, {
    id: 'attachment-1',
    name: 'report.pdf',
    sizeBytes: 2048,
    mediaType: 'application/pdf',
    now: '2026-09-16T09:00:00.000Z',
  })
}

describe('Task attachment copy boundaries', () => {
  it('does not copy attachment metadata into duplicates or recurring occurrences', () => {
    const source = attachedTask()

    const duplicate = duplicateTask(source, {
      id: 'task-2',
      now: '2026-09-16T10:00:00.000Z',
    })
    expect(duplicate.estimateMinutes).toBe(45)
    expect(duplicate).not.toHaveProperty('attachments')

    const recurring = setTaskRecurrence(
      setTaskDueDate({ ...source, status: 'done' }, '2026-09-17'),
      { unit: 'day', interval: 1 },
    )
    const occurrence = createNextRecurringTaskOccurrence(recurring, {
      id: 'task-3',
      now: '2026-09-17T10:00:00.000Z',
    })
    expect(occurrence.estimateMinutes).toBe(45)
    expect(occurrence).not.toHaveProperty('attachments')
  })

  it('keeps attachment metadata out of Task and Project Templates', () => {
    const source = attachedTask()
    const taskTemplate = createTaskTemplate({
      id: 'task-template-1',
      name: 'Reusable Task',
      now: '2026-09-16T10:00:00.000Z',
      rootTask: source,
      tasks: [source],
    })
    expect(taskTemplate.tasks[0]).not.toHaveProperty('attachments')

    let taskId = 0
    const taskInstance = instantiateTaskTemplate(taskTemplate, {
      projectId: 'project-2',
      now: '2026-09-16T11:00:00.000Z',
      nextId: () => `task-copy-${++taskId}`,
    })
    expect(taskInstance.rootTask.estimateMinutes).toBe(45)
    expect(taskInstance.rootTask).not.toHaveProperty('attachments')

    const projectTemplate = createProjectTemplate({
      id: 'project-template-1',
      name: 'Reusable Project',
      now: '2026-09-16T10:00:00.000Z',
      project: {
        id: 'project-1',
        name: 'Project',
        createdAt: '2026-09-16T08:00:00.000Z',
      },
      lists: [],
      tasks: [source],
    })
    expect(projectTemplate.tasks[0]).not.toHaveProperty('attachments')

    let projectId = 0
    const projectInstance = instantiateProjectTemplate(projectTemplate, {
      now: '2026-09-16T11:00:00.000Z',
      nextId: () => `project-copy-${++projectId}`,
    })
    expect(projectInstance.tasks[0]?.estimateMinutes).toBe(45)
    expect(projectInstance.tasks[0]).not.toHaveProperty('attachments')
  })
})
