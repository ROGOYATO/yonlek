/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('WorkspaceRoot Board view', () => {
  it('renders fixed status columns with existing Task actions and restores List grouping when switched back', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-1',
      'task-beta',
      'task-alpha',
      'task-camera',
      'task-done',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T21:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const beta = commands.addTask(project.id, 'Beta')
    const alpha = commands.addTask(project.id, 'Alpha')
    const camera = commands.addTask(project.id, 'Calibrate camera')
    const done = commands.addTask(project.id, 'Publish results')
    commands.changeTaskPriority(beta.id, 'high')
    commands.changeTaskPriority(alpha.id, 'low')
    commands.changeTaskStatus(camera.id, 'doing')
    commands.changeTaskStatus(done.id, 'done')
    commands.changeTaskPriority(done.id, 'high')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        group: 'priority',
        viewMode: 'board',
      },
    )

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
      />,
    )

    const projectHeading = screen.getByRole('heading', {
      name: 'Robotics Research',
    })
    const projectSection = projectHeading.closest('section')
    expect(projectSection).not.toBeNull()
    const projectView = within(projectSection as HTMLElement)

    expect(projectView.getByRole('heading', { name: 'To do' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Doing' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Done' })).toBeTruthy()
    expect(projectView.queryByRole('heading', { name: 'High' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Normal' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Low' })).toBeNull()

    const boardTasks = projectView.getAllByRole('listitem', {
      name: /board task/,
    })
    expect(boardTasks.map((item) => item.getAttribute('aria-label'))).toEqual([
      'To do board task Alpha',
      'To do board task Beta',
      'Doing board task Calibrate camera',
      'Done board task Publish results',
    ])
    expect(
      projectView.getByRole('button', { name: 'Duplicate task Alpha' }),
    ).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Task view'), 'list')

    expect(projectView.queryByRole('listitem', { name: /board task/ })).toBeNull()
    expect(projectView.getByRole('heading', { name: 'High' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Normal' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Low' })).toBeTruthy()
    expect(ids).toEqual([])
  })
})
