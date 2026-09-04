import { describe, expect, it } from 'vitest'

import * as taskListDomain from './task-list'

function createTaskList() {
  return (
    taskListDomain as typeof taskListDomain & {
      createTaskList?: (input: {
        id: string
        projectId: string
        name: string
        now: string
      }) => {
        id: string
        projectId: string
        name: string
        createdAt: string
      }
    }
  ).createTaskList
}

function renameTaskList() {
  return (
    taskListDomain as typeof taskListDomain & {
      renameTaskList?: (
        list: {
          id: string
          projectId: string
          name: string
          createdAt: string
        },
        name: string,
      ) => {
        id: string
        projectId: string
        name: string
        createdAt: string
      }
    }
  ).renameTaskList
}

describe('task list domain', () => {
  it('creates a list with trimmed project id and name', () => {
    expect(
      createTaskList()?.({
        id: 'list-1',
        projectId: '  project-1  ',
        name: '  Backlog  ',
        now: '2026-09-04T03:10:00.000Z',
      }),
    ).toEqual({
      id: 'list-1',
      projectId: 'project-1',
      name: 'Backlog',
      createdAt: '2026-09-04T03:10:00.000Z',
    })
  })

  it('rejects blank list names and project ids', () => {
    expect(() =>
      createTaskList()?.({
        id: 'list-1',
        projectId: 'project-1',
        name: '   ',
        now: '2026-09-04T03:10:00.000Z',
      }),
    ).toThrow('List name is required')

    expect(() =>
      createTaskList()?.({
        id: 'list-1',
        projectId: '   ',
        name: 'Backlog',
        now: '2026-09-04T03:10:00.000Z',
      }),
    ).toThrow('List project is required')
  })

  it('renames a list without mutating the original', () => {
    const list = {
      id: 'list-1',
      projectId: 'project-1',
      name: 'Backlog',
      createdAt: '2026-09-04T03:10:00.000Z',
    }

    const next = renameTaskList()?.(list, '  Sprint 1  ')

    expect(next?.name).toBe('Sprint 1')
    expect(list.name).toBe('Backlog')
  })
})
