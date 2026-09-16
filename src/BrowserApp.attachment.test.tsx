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

function attachedWorkspace(title: string) {
  const project = createProject({
    id: 'project-1',
    name: 'Project',
    now: '2026-09-16T08:00:00.000Z',
  })
  const task = createTask({
    id: 'task-1',
    projectId: project.id,
    title,
    now: '2026-09-16T08:00:00.000Z',
  })

  return { project, task }
}

describe('BrowserApp Task attachment metadata', () => {
  it('adds, persists, reloads, and deletes metadata selected from a File input', async () => {
    const storage = new MemoryStore()
    const { project, task } = attachedWorkspace('Attachment task')
    saveWorkspace(storage, { projects: [project], tasks: [task] })
    expect(loadWorkspace(storage).tasks.map((candidate) => candidate.title)).toEqual([
      'Attachment task',
    ])

    const user = userEvent.setup()
    const runtime = {
      nextId: () => 'attachment-1',
      now: () => '2026-09-16T09:00:00.000Z',
    }
    const first = render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getByText('Attachment task')).toBeTruthy()

    const input = screen.getByLabelText(
      'Add attachment for Attachment task',
    ) as HTMLInputElement
    const file = new File(['hello'], 'report.pdf', {
      type: 'application/pdf',
    })
    await user.upload(input, file)

    expect(loadWorkspace(storage).tasks[0]?.attachments).toEqual([
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 5,
        mediaType: 'application/pdf',
        addedAt: '2026-09-16T09:00:00.000Z',
      },
    ])
    expect(screen.getByText('report.pdf')).toBeTruthy()
    expect(
      screen.getByText('Attachment metadata only. File content is not stored.'),
    ).toBeTruthy()

    first.unmount()
    render(<BrowserApp storage={storage} runtime={runtime} />)
    expect(screen.getByText('report.pdf')).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete attachment report.pdf from Attachment task',
      }),
    )
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('attachments')
  })

  it('stores zero-byte files without inventing a media type, path, or content field', async () => {
    const storage = new MemoryStore()
    const { project, task } = attachedWorkspace('Empty attachment')
    saveWorkspace(storage, { projects: [project], tasks: [task] })

    const user = userEvent.setup()
    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'attachment-empty',
          now: () => '2026-09-16T09:30:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('Empty attachment')).toBeTruthy()

    const input = screen.getByLabelText(
      'Add attachment for Empty attachment',
    ) as HTMLInputElement
    await user.upload(input, new File([], 'empty.txt'))

    const attachment = loadWorkspace(storage).tasks[0]?.attachments?.[0]
    expect(attachment).toEqual({
      id: 'attachment-empty',
      name: 'empty.txt',
      sizeBytes: 0,
      addedAt: '2026-09-16T09:30:00.000Z',
    })
    expect(attachment).not.toHaveProperty('path')
    expect(attachment).not.toHaveProperty('content')
  })
})
