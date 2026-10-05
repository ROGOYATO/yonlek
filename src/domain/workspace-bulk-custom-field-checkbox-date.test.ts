import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-06T00:20:00.000Z',
})
const verified = {
  id: 'field-verified',
  name: 'Verified',
  type: 'checkbox' as const,
  createdAt: '2026-10-06T00:21:00.000Z',
}
const reviewDate = {
  id: 'field-review-date',
  name: 'Review date',
  type: 'date' as const,
  createdAt: '2026-10-06T00:22:00.000Z',
}

describe('Workspace bulk Custom Field checkbox and date values', () => {
  it('sets typed checkbox/date values and clears them across selected Tasks', () => {
    const first = createTask({
      id: 'task-first',
      projectId: project.id,
      title: 'First',
      now: '2026-10-06T00:23:00.000Z',
    })
    const second = createTask({
      id: 'task-second',
      projectId: project.id,
      title: 'Second',
      now: '2026-10-06T00:24:00.000Z',
    })
    const state: WorkspaceState = {
      customFields: [verified, reviewDate],
      projects: [project],
      tasks: [first, second],
    }

    const checked = workspaceReducer(state, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [first.id, second.id],
      fieldId: verified.id,
      value: true,
    } as never)

    expect(
      checked.tasks.map((task) => task.customFieldValues?.[verified.id]),
    ).toEqual([true, true])

    const dated = workspaceReducer(checked, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [second.id, first.id, second.id],
      fieldId: reviewDate.id,
      value: ' 2026-10-28 ',
    } as never)

    expect(
      dated.tasks.map((task) => task.customFieldValues?.[reviewDate.id]),
    ).toEqual(['2026-10-28', '2026-10-28'])

    const cleared = workspaceReducer(dated, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [first.id, second.id],
      fieldId: verified.id,
      value: null,
    } as never)

    expect(
      cleared.tasks.map((task) => task.customFieldValues?.[verified.id]),
    ).toEqual([undefined, undefined])
  })
})
