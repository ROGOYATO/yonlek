/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('WorkspaceRoot additional task relationships', () => {
  it('creates, summarizes, renders, and reloads Duplicates and References', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'task-2',
      'task-3',
      'relationship-1',
      'relationship-2',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T15:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    commands.addTask(project.id, 'Calibrate camera')
    commands.addTask(project.id, 'Run experiment')

    const firstRender = render(
      <WorkspaceRoot store={store} commands={commands} />,
    )

    await user.selectOptions(
      screen.getByLabelText('Relationship type from Draft experiment plan'),
      'duplicates',
    )
    await user.selectOptions(
      screen.getByLabelText('Relationship target from Draft experiment plan'),
      'task-2',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add relationship from Draft experiment plan',
      }),
    )

    await user.selectOptions(
      screen.getByLabelText('Relationship type from Draft experiment plan'),
      'references',
    )
    await user.selectOptions(
      screen.getByLabelText('Relationship target from Draft experiment plan'),
      'task-3',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Add relationship from Draft experiment plan',
      }),
    )

    expect(screen.getByText('Duplicates Calibrate camera')).toBeTruthy()
    expect(screen.getByText('Duplicated by Draft experiment plan')).toBeTruthy()
    expect(screen.getByText('References Run experiment')).toBeTruthy()
    expect(screen.getByText('Referenced by Draft experiment plan')).toBeTruthy()
    expect(
      screen.getByLabelText(
        'Relationship summary for Draft experiment plan',
      ).textContent,
    ).toBe(
      'Blocks 0; Blocked by 0; Related 0; Duplicates 1; Duplicated by 0; References 1; Referenced by 0',
    )

    firstRender.unmount()

    const reloadedStore = createWorkspaceStore(storage)
    const reloadedCommands = createWorkspaceCommands(reloadedStore, {
      nextId: () => 'unused-id',
      now: () => '2026-10-04T15:31:00.000Z',
    })

    render(
      <WorkspaceRoot
        store={reloadedStore}
        commands={reloadedCommands}
      />,
    )

    expect(screen.getByText('Duplicates Calibrate camera')).toBeTruthy()
    expect(screen.getByText('References Run experiment')).toBeTruthy()
  })
})
