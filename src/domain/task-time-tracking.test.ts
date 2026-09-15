import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type TrackingDomain = typeof taskDomain & {
  addTaskTrackedMinutes?: (
    task: taskDomain.Task,
    input: { id: string; minutes: number; now: string },
  ) => taskDomain.Task
  startTaskTimer?: (task: taskDomain.Task, startedAt: string) => taskDomain.Task
  stopTaskTimer?: (
    task: taskDomain.Task,
    input: { id: string; stoppedAt: string },
  ) => taskDomain.Task
  deleteTaskTimeEntry?: (task: taskDomain.Task, entryId: string) => taskDomain.Task
  getTaskTrackedMinutes?: (task: taskDomain.Task) => number
}

function task() {
  return taskDomain.createTask({
    id: 'task-1',
    projectId: 'project-1',
    title: 'Track work',
    now: '2026-09-15T09:00:00.000Z',
  })
}

describe('Task time tracking', () => {
  it('adds and deletes immutable manual entries and totals tracked minutes', () => {
    const domain = taskDomain as TrackingDomain
    expect(domain.addTaskTrackedMinutes).toBeTypeOf('function')
    expect(domain.deleteTaskTimeEntry).toBeTypeOf('function')
    expect(domain.getTaskTrackedMinutes).toBeTypeOf('function')

    const source = task()
    const withEntry = domain.addTaskTrackedMinutes!(source, {
      id: 'entry-1',
      minutes: 30,
      now: '2026-09-15T10:00:00.000Z',
    })

    expect(withEntry.timeEntries).toEqual([
      {
        id: 'entry-1',
        durationMs: 30 * 60_000,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
    ])
    expect(domain.getTaskTrackedMinutes!(withEntry)).toBe(30)
    expect(source).not.toHaveProperty('timeEntries')

    const withoutEntry = domain.deleteTaskTimeEntry!(withEntry, 'entry-1')
    expect(withoutEntry).not.toHaveProperty('timeEntries')
    expect(withEntry.timeEntries).toHaveLength(1)

    for (const minutes of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        domain.addTaskTrackedMinutes!(source, {
          id: 'entry-invalid',
          minutes,
          now: '2026-09-15T10:00:00.000Z',
        }),
      ).toThrow('Tracked minutes must be a positive integer')
    }

    expect(() =>
      domain.addTaskTrackedMinutes!(withEntry, {
        id: 'entry-1',
        minutes: 10,
        now: '2026-09-15T11:00:00.000Z',
      }),
    ).toThrow('Task time entry ID must be unique')
  })

  it('starts and stops one timer while keeping exact elapsed milliseconds', () => {
    const domain = taskDomain as TrackingDomain
    expect(domain.startTaskTimer).toBeTypeOf('function')
    expect(domain.stopTaskTimer).toBeTypeOf('function')

    const source = task()
    const started = domain.startTaskTimer!(source, '2026-09-15T10:00:00.000Z')
    expect(started.timerStartedAt).toBe('2026-09-15T10:00:00.000Z')
    expect(source).not.toHaveProperty('timerStartedAt')
    expect(() =>
      domain.startTaskTimer!(started, '2026-09-15T10:05:00.000Z'),
    ).toThrow('Task timer is already running')

    const stopped = domain.stopTaskTimer!(started, {
      id: 'entry-timer',
      stoppedAt: '2026-09-15T10:45:00.000Z',
    })
    expect(stopped).not.toHaveProperty('timerStartedAt')
    expect(stopped.timeEntries).toEqual([
      {
        id: 'entry-timer',
        durationMs: 45 * 60_000,
        recordedAt: '2026-09-15T10:45:00.000Z',
      },
    ])

    expect(() =>
      domain.stopTaskTimer!(source, {
        id: 'entry-missing',
        stoppedAt: '2026-09-15T10:45:00.000Z',
      }),
    ).toThrow('Task timer is not running')
    expect(() =>
      domain.stopTaskTimer!(started, {
        id: 'entry-zero',
        stoppedAt: '2026-09-15T10:00:00.000Z',
      }),
    ).toThrow('Task timer stop time must be after start time')
  })
})
