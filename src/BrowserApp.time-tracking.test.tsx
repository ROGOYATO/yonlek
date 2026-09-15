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

function trackedWorkspace(title: string) {
  const project = createProject({
    id: 'project-1',
    name: 'Project',
    now: '2026-09-15T09:00:00.000Z',
  })
  const task = createTask({
    id: 'task-1',
    projectId: project.id,
    title,
    now: '2026-09-15T09:00:00.000Z',
  })

  return { project, task }
}

describe('BrowserApp Task time tracking', () => {
  it('adds, persists, and deletes manual tracked minutes', async () => {
    const storage = new MemoryStore()
    const { project, task } = trackedWorkspace('Manual tracking')
    saveWorkspace(storage, { projects: [project], tasks: [task] })
    expect(loadWorkspace(storage).tasks.map((candidate) => candidate.title)).toEqual([
      'Manual tracking',
    ])

    const user = userEvent.setup()
    const runtime = {
      nextId: () => 'entry-manual',
      now: () => '2026-09-15T10:00:00.000Z',
    }
    const first = render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getByText('Manual tracking')).toBeTruthy()

    const input = screen.getByLabelText(
      'Add tracked minutes for Manual tracking',
    ) as HTMLInputElement
    await user.type(input, '30')
    await user.click(
      screen.getByRole('button', {
        name: 'Add tracked time for Manual tracking',
      }),
    )
    expect(screen.getByText('Tracked time for Manual tracking: 30 minutes')).toBeTruthy()

    first.unmount()
    render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getByText('Tracked time for Manual tracking: 30 minutes')).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete time entry 1 for Manual tracking',
      }),
    )
    expect(screen.getByText('Tracked time for Manual tracking: 0 minutes')).toBeTruthy()
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('timeEntries')
  })

  it('persists a running timer across reload and records its elapsed time on stop', async () => {
    const storage = new MemoryStore()
    const { project, task } = trackedWorkspace('Timer tracking')
    saveWorkspace(storage, { projects: [project], tasks: [task] })
    expect(loadWorkspace(storage).tasks.map((candidate) => candidate.id)).toEqual([
      'task-1',
    ])

    const user = userEvent.setup()
    const first = render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-before-stop',
          now: () => '2026-09-15T11:00:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('Timer tracking')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Start timer for Timer tracking' }),
    )
    expect(loadWorkspace(storage).tasks[0]?.timerStartedAt).toBe(
      '2026-09-15T11:00:00.000Z',
    )

    first.unmount()
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'entry-timer',
          now: () => '2026-09-15T11:45:00.000Z',
        }}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Stop timer for Timer tracking' }),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Stop timer for Timer tracking' }),
    )
    expect(screen.getByText('Tracked time for Timer tracking: 45 minutes')).toBeTruthy()
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('timerStartedAt')
    expect(loadWorkspace(storage).tasks[0]?.timeEntries?.[0]).toMatchObject({
      id: 'entry-timer',
      durationMs: 45 * 60_000,
    })
  })

  it('shows an error and keeps persisted state unchanged for invalid manual minutes', async () => {
    const storage = new MemoryStore()
    const { project, task } = trackedWorkspace('Invalid tracking')
    saveWorkspace(storage, { projects: [project], tasks: [task] })

    const user = userEvent.setup()
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'entry-invalid',
          now: () => '2026-09-15T10:00:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('Invalid tracking')).toBeTruthy()

    const input = screen.getByLabelText(
      'Add tracked minutes for Invalid tracking',
    ) as HTMLInputElement
    await user.type(input, '0')
    await user.click(
      screen.getByRole('button', {
        name: 'Add tracked time for Invalid tracking',
      }),
    )
    expect(screen.getByRole('alert').textContent).toContain(
      'Tracked minutes must be a positive integer',
    )
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('timeEntries')
  })
})
