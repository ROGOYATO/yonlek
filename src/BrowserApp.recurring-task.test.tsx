/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
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

describe('BrowserApp recurring Tasks', () => {
  it('configures recurrence, completes one occurrence, and persists the next occurrence across reload', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Research',
      now: '2026-09-13T09:00:00.000Z',
    })
    const task = {
      ...createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Monthly report',
        now: '2026-09-13T09:01:00.000Z',
      }),
      startDate: '2026-01-30',
      dueDate: '2026-01-31',
      checklist: [{ id: 'check-1', text: 'Send report', completed: true }],
    }

    saveWorkspace(storage, { projects: [project], tasks: [task] })

    let nextIdCalls = 0
    let nowCalls = 0
    const runtime = {
      nextId: () => {
        nextIdCalls += 1
        return 'task-next'
      },
      now: () => {
        nowCalls += 1
        return '2026-02-01T10:00:00.000Z'
      },
    }

    const rendered = render(<BrowserApp storage={storage} runtime={runtime} />)

    const recurrence = screen.getByLabelText(
      'Recurrence for Monthly report',
    ) as HTMLSelectElement
    expect(recurrence.value).toBe('')
    await user.selectOptions(recurrence, 'month')
    expect(loadWorkspace(storage).tasks[0]?.recurrence).toEqual({
      unit: 'month',
      interval: 1,
    })

    const interval = screen.getByLabelText(
      'Recurrence interval for Monthly report',
    ) as HTMLInputElement
    expect(interval.value).toBe('1')

    await user.selectOptions(
      screen.getByLabelText('Status for Monthly report'),
      'done',
    )

    const saved = loadWorkspace(storage)
    expect(saved.tasks).toHaveLength(2)
    expect(saved.tasks.find((candidate) => candidate.id === 'task-1')).toMatchObject({
      status: 'done',
      startDate: '2026-01-30',
      dueDate: '2026-01-31',
      recurrence: { unit: 'month', interval: 1 },
    })
    expect(saved.tasks.find((candidate) => candidate.id === 'task-next')).toMatchObject({
      status: 'todo',
      startDate: '2026-02-28',
      dueDate: '2026-02-28',
      recurrence: { unit: 'month', interval: 1 },
      checklist: [{ id: 'check-1', text: 'Send report', completed: false }],
    })
    expect(nextIdCalls).toBe(1)
    expect(nowCalls).toBe(1)

    const statuses = screen.getAllByLabelText('Status for Monthly report') as HTMLSelectElement[]
    expect(statuses.map((control) => control.value).sort()).toEqual(['done', 'todo'])

    rendered.unmount()
    render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getAllByLabelText('Recurrence for Monthly report')).toHaveLength(2)
    expect(loadWorkspace(storage).tasks).toHaveLength(2)
  })

  it('refuses to enable recurrence before a due date exists', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Research',
      now: '2026-09-13T09:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'No due date',
      now: '2026-09-13T09:01:00.000Z',
    })
    saveWorkspace(storage, { projects: [project], tasks: [task] })

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused',
          now: () => '2026-09-13T10:00:00.000Z',
        }}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Recurrence for No due date'), 'day')
    expect(screen.getByRole('alert').textContent).toContain(
      'Recurring task requires a valid due date',
    )
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('recurrence')
  })
})
