/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
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

describe('WorkspaceRoot task templates', () => {
  it('saves a task subtree as a template, creates it in a selected project and list, and deletes the template', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-source',
      'list-source',
      'task-root',
      'task-child',
      'project-target',
      'list-target',
      'template-1',
      'task-new-root',
      'task-new-child',
    ]
    const times = [
      '2026-09-04T23:20:00.000Z',
      '2026-09-04T23:21:00.000Z',
      '2026-09-04T23:22:00.000Z',
      '2026-09-04T23:23:00.000Z',
      '2026-09-04T23:24:00.000Z',
      '2026-09-04T23:25:00.000Z',
      '2026-09-04T23:26:00.000Z',
      '2026-09-04T23:27:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => times.shift() ?? 'unexpected-time',
    })
    const sourceProject = commands.addProject('Source project')
    const sourceList = commands.addTaskList(sourceProject.id, 'Source list')
    const root = commands.addTask(
      sourceProject.id,
      'Define protocol',
      sourceList.id,
    )
    commands.addSubtask(root.id, 'Calibrate camera')
    const targetProject = commands.addProject('Target project')
    commands.addTaskList(targetProject.id, 'Target list')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Save task as template Define protocol',
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Task templates' }),
    ).toBeTruthy()

    await user.selectOptions(
      screen.getByLabelText('Project for task template Define protocol'),
      targetProject.id,
    )
    await user.selectOptions(
      screen.getByLabelText('List for task template Define protocol'),
      'list-target',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Create task from template Define protocol',
      }),
    )

    const targetProjectSection = screen
      .getByRole('heading', { name: 'Target project' })
      .closest('section')
    expect(targetProjectSection).not.toBeNull()
    const targetProjectView = within(targetProjectSection as HTMLElement)
    expect(targetProjectView.getByText('Define protocol')).toBeTruthy()
    expect(targetProjectView.getByText('Calibrate camera')).toBeTruthy()

    const taskTemplatesSection = screen
      .getByRole('heading', { name: 'Task templates' })
      .closest('section')
    expect(taskTemplatesSection).not.toBeNull()
    expect(
      within(taskTemplatesSection as HTMLElement).getByText('Define protocol'),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete task template Define protocol',
      }),
    )

    expect(
      screen.queryByRole('heading', { name: 'Task templates' }),
    ).toBeNull()
    expect(ids).toEqual([])
    expect(times).toEqual([])
  })
})
