import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-06T00:30:00.000Z',
})
const stage = {
  id: 'field-stage',
  name: 'Stage',
  type: 'select' as const,
  createdAt: '2026-10-06T00:31:00.000Z',
  options: [
    { id: 'option-ready', name: 'Ready' },
    { id: 'option-blocked', name: 'Blocked' },
  ],
}
const formula = {
  id: 'field-formula',
  name: 'Computed',
  type: 'formula' as const,
  createdAt: '2026-10-06T00:32:00.000Z',
}

describe('Workspace bulk Custom Field select and validation integrity', () => {
  it('preserves select, migration, missing-field, and type validation without partial mutation', () => {
    const first = createTask({
      id: 'task-first',
      projectId: project.id,
      title: 'First',
      now: '2026-10-06T00:33:00.000Z',
    })
    const second = createTask({
      id: 'task-second',
      projectId: project.id,
      title: 'Second',
      now: '2026-10-06T00:34:00.000Z',
    })
    const state: WorkspaceState = {
      customFields: [stage, formula],
      projects: [project],
      tasks: [first, second],
    }

    const selected = workspaceReducer(state, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [second.id, first.id, second.id],
      fieldId: stage.id,
      value: 'option-ready',
    } as never)

    expect(
      selected.tasks.map((task) => task.customFieldValues?.[stage.id]),
    ).toEqual(['option-ready', 'option-ready'])

    expect(() =>
      workspaceReducer(selected, {
        type: 'task/customFieldValueChangedBulk',
        taskIds: [first.id, second.id],
        fieldId: stage.id,
        value: 'missing-option',
      } as never),
    ).toThrow('Custom field option not found')
    expect(
      selected.tasks.map((task) => task.customFieldValues?.[stage.id]),
    ).toEqual(['option-ready', 'option-ready'])

    expect(() =>
      workspaceReducer(selected, {
        type: 'task/customFieldValueChangedBulk',
        taskIds: [first.id, second.id],
        fieldId: formula.id,
        value: 5,
      } as never),
    ).toThrow('Custom field value does not match field type')

    const migrated = workspaceReducer(selected, {
      type: 'customField/typeChanged',
      fieldId: stage.id,
      nextType: 'number',
    } as never)
    expect(
      migrated.tasks.map((task) => task.customFieldValues?.[stage.id]),
    ).toEqual([undefined, undefined])

    expect(() =>
      workspaceReducer(migrated, {
        type: 'task/customFieldValueChangedBulk',
        taskIds: [first.id, second.id],
        fieldId: stage.id,
        value: 'option-ready',
      } as never),
    ).toThrow('Custom field value does not match field type')

    const numbered = workspaceReducer(migrated, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [first.id, second.id],
      fieldId: stage.id,
      value: 17,
    } as never)
    expect(
      numbered.tasks.map((task) => task.customFieldValues?.[stage.id]),
    ).toEqual([17, 17])

    const withoutField = workspaceReducer(numbered, {
      type: 'customField/deleted',
      fieldId: stage.id,
    } as never)
    expect(() =>
      workspaceReducer(withoutField, {
        type: 'task/customFieldValueChangedBulk',
        taskIds: [first.id, second.id],
        fieldId: stage.id,
        value: 23,
      } as never),
    ).toThrow('Cannot set a missing custom field')
  })
})
