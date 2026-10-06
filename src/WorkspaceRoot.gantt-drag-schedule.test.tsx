/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  createDefaultViewPreferences,
  updateViewPreferences,
} from './domain/view-preferences'
import type { KeyValueStore } from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

class MemoryDataTransfer {
  private readonly values = new Map<string, string>()

  setData(type: string, value: string) {
    this.values.set(type, value)
  }

  getData(type: string) {
    return this.values.get(type) ?? ''
  }
}

describe('WorkspaceRoot Gantt drag scheduling', () => {
  it('applies the two explicit Gantt draft dates when the matching Task is dropped', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T00:40:00.000Z',
    })
    const project = commands.addProject('Launch')
    const task = commands.addTask(project.id, 'Prepare release')
    commands.changeTaskStartDate(task.id, '2026-10-10')
    commands.changeTaskDueDate(task.id, '2026-10-12')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      { projectView: project.id, viewMode: 'gantt' },
    )

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
      />,
    )

    fireEvent.change(screen.getByLabelText('Gantt start for Prepare release'), {
      target: { value: '2026-10-20' },
    })
    fireEvent.change(screen.getByLabelText('Gantt due for Prepare release'), {
      target: { value: '2026-10-22' },
    })

    const dataTransfer = new MemoryDataTransfer()
    fireEvent.dragStart(
      screen.getByRole('listitem', {
        name: '2026-10-10 to 2026-10-12 Gantt item Prepare release',
      }),
      { dataTransfer },
    )
    fireEvent.drop(screen.getByLabelText('Drop Gantt schedule for Prepare release'), {
      dataTransfer,
    })

    expect(store.getState().tasks[0]).toMatchObject({
      startDate: '2026-10-20',
      dueDate: '2026-10-22',
    })
    expect(ids).toEqual([])
  })
})
