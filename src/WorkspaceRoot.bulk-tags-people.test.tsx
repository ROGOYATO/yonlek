/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
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

describe('WorkspaceRoot bulk Tags and People', () => {
  it('adds/removes one Tag and assigns/unassigns one Person for selected visible Tasks', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['tag-1', 'person-1', 'project-1', 'task-a', 'task-b']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-05T19:40:00.000Z',
    })
    const tag = commands.addTag('Safety')
    const person = commands.addPerson('Ada Lovelace')
    const project = commands.addProject('Launch')
    const first = commands.addTask(project.id, 'First')
    const second = commands.addTask(project.id, 'Second')

    render(<WorkspaceRoot store={store} commands={commands} />)

    fireEvent.change(screen.getByLabelText('Bulk tag'), {
      target: { value: tag.id },
    })
    fireEvent.change(screen.getByLabelText('Bulk assignee'), {
      target: { value: person.id },
    })

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(screen.getByRole('button', { name: 'Add bulk tag' }))
    expect(store.getState().tasks.map((task) => task.tagIds)).toEqual([
      [tag.id],
      [tag.id],
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove bulk tag' }))
    expect(store.getState().tasks.every((task) => task.tagIds === undefined)).toBe(true)

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(screen.getByRole('button', { name: 'Assign bulk person' }))
    expect(store.getState().tasks.map((task) => task.assigneeIds)).toEqual([
      [person.id],
      [person.id],
    ])

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(screen.getByRole('button', { name: 'Unassign bulk person' }))
    expect(store.getState().tasks.every((task) => task.assigneeIds === undefined)).toBe(true)
    expect(store.getState().tasks.map((task) => task.id)).toEqual([first.id, second.id])
    expect(ids).toEqual([])
  })
})
