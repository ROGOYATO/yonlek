/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createProject } from './domain/project'
import {
  createTask,
  setTaskDueDate,
  setTaskRecurrence,
  setTaskTimeEstimate,
} from './domain/task'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function estimatedWorkspace(title: string) {
  const project = createProject({
    id: 'p1',
    name: 'P',
    now: '2026-09-14T12:00:00.000Z',
  })
  const task = createTask({
    id: 't1',
    projectId: project.id,
    title,
    now: '2026-09-14T12:00:00.000Z',
  })

  return { project, task }
}

describe('BrowserApp Task time estimates', () => {
  it('sets, clears, and persists a Task estimate across reload', async () => {
    const storage = new MemoryStore()
    const { project, task } = estimatedWorkspace('Estimated task')
    saveWorkspace(storage, { projects: [project], tasks: [task] })
    expect(loadWorkspace(storage).tasks.map((candidate) => candidate.title)).toEqual([
      'Estimated task',
    ])

    const user = userEvent.setup()
    const runtime = {
      nextId: () => 'unused',
      now: () => '2026-09-14T13:00:00.000Z',
    }
    const first = render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getByText('Estimated task')).toBeTruthy()

    const input = screen.getByLabelText(
      'Time estimate (minutes) for Estimated task',
    ) as HTMLInputElement
    await user.clear(input)
    await user.type(input, '90')
    input.blur()
    expect(input.value).toBe('90')

    first.unmount()
    render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(
      (screen.getByLabelText(
        'Time estimate (minutes) for Estimated task',
      ) as HTMLInputElement).value,
    ).toBe('90')

    const reloaded = screen.getByLabelText(
      'Time estimate (minutes) for Estimated task',
    ) as HTMLInputElement
    await user.clear(reloaded)
    reloaded.blur()
    expect(reloaded.value).toBe('')
  })

  it('shows the copied estimate on a generated recurring occurrence', async () => {
    const storage = new MemoryStore()
    const { project, task } = estimatedWorkspace('Recurring estimate')
    const recurring = setTaskTimeEstimate(
      setTaskRecurrence(setTaskDueDate(task, '2026-09-15'), {
        unit: 'day',
        interval: 1,
      }),
      30,
    )
    saveWorkspace(storage, { projects: [project], tasks: [recurring] })
    expect(loadWorkspace(storage).tasks).toHaveLength(1)

    const user = userEvent.setup()
    let id = 0
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => `generated-${++id}`,
          now: () => '2026-09-14T13:00:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('Recurring estimate')).toBeTruthy()

    await user.selectOptions(
      screen.getByLabelText('Status for Recurring estimate'),
      'done',
    )
    const estimates = screen.getAllByLabelText(
      'Time estimate (minutes) for Recurring estimate',
    ) as HTMLInputElement[]
    expect(estimates.map((input) => input.value)).toEqual(['30', '30'])
  })

  it('shows an error and keeps state unchanged for invalid estimates', async () => {
    const storage = new MemoryStore()
    const { project, task } = estimatedWorkspace('Estimated task')
    saveWorkspace(storage, { projects: [project], tasks: [task] })
    expect(loadWorkspace(storage).tasks.map((candidate) => candidate.id)).toEqual([
      't1',
    ])

    const user = userEvent.setup()
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused',
          now: () => '2026-09-14T13:00:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('Estimated task')).toBeTruthy()

    const input = screen.getByLabelText(
      'Time estimate (minutes) for Estimated task',
    ) as HTMLInputElement
    await user.clear(input)
    await user.type(input, '0')
    input.blur()
    expect(screen.getByRole('alert').textContent).toContain(
      'Task time estimate must be a positive integer number of minutes',
    )
  })
})
