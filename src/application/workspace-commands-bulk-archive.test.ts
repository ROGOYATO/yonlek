import { describe, expect, it } from 'vitest'

import type { KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'

class CountingStore implements KeyValueStore {
  private readonly values = new Map<string, string>()
  writes = 0

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.writes += 1
    this.values.set(key, value)
  }
}

describe('bulk Task archive command', () => {
  it('archives selected roots and their subtrees with one timestamp and one persisted dispatch', () => {
    const storage = new CountingStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-parent', 'task-child', 'task-peer']
    const timestamps = [
      '2026-09-13T01:20:00.000Z',
      '2026-09-13T01:21:00.000Z',
      '2026-09-13T01:22:00.000Z',
      '2026-09-13T01:23:00.000Z',
      '2026-09-13T01:24:00.000Z',
    ]
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => {
        const value = timestamps[nowCalls] ?? 'unexpected-time'
        nowCalls += 1
        return value
      },
    })
    const project = commands.addProject('Robotics Research')
    const parent = commands.addTask(project.id, 'Parent')
    const child = commands.addSubtask(parent.id, 'Child')
    const peer = commands.addTask(project.id, 'Peer')
    const writesBeforeBulk = storage.writes
    const nowCallsBeforeBulk = nowCalls

    commands.archiveTasks([parent.id, peer.id])

    expect(nowCalls).toBe(nowCallsBeforeBulk + 1)
    expect(
      store.getState().tasks.map((task) => [task.id, task.archivedAt]),
    ).toEqual([
      [parent.id, '2026-09-13T01:24:00.000Z'],
      [child.id, '2026-09-13T01:24:00.000Z'],
      [peer.id, '2026-09-13T01:24:00.000Z'],
    ])
    expect(storage.writes).toBe(writesBeforeBulk + 1)
  })
})
