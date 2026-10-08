/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import { createDefaultViewPreferences, updateViewPreferences } from './domain/view-preferences'
import { loadWorkspace, type KeyValueStore } from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

class MemoryStore implements KeyValueStore {
  private readonly items = new Map<string, string>()
  getItem(key: string) { return this.items.get(key) ?? null }
  setItem(key: string, value: string) { this.items.set(key, value) }
}

describe('WorkspaceRoot Gantt milestones and baselines', () => {
  it('toggles milestone, captures baseline, and shows a changed schedule after a move', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected',
      now: () => '2026-10-08T07:40:00.000Z',
    })
    const project = commands.addProject('Launch')
    const task = commands.addTask(project.id, 'Quality gate')
    commands.changeTaskGanttSchedule(task.id, '2026-10-10', '2026-10-10')
    render(<WorkspaceRoot
      store={store} commands={commands}
      initialViewPreferences={updateViewPreferences(createDefaultViewPreferences(), {
        projectView: project.id, viewMode: 'gantt',
      })}
    />)
    const gantt = screen.getByRole('list', { name: 'Task Gantt for Launch' })
    expect(within(gantt).queryByText('Milestone')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mark milestone Quality gate' }))
    expect(within(gantt).getByText('Milestone')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Capture Gantt baseline for Quality gate' }))
    expect(within(gantt).getByText('Baseline unchanged')).toBeTruthy()
    act(() => commands.changeTaskGanttSchedule(task.id, '2026-10-20', '2026-10-20'))
    expect(within(gantt).getByText('Baseline changed')).toBeTruthy()
    expect(loadWorkspace(storage).tasks[0]).toMatchObject({
      isMilestone: true,
      ganttBaseline: { startDate: '2026-10-10', dueDate: '2026-10-10' },
    })
    expect(ids).toEqual([])
  })
})
