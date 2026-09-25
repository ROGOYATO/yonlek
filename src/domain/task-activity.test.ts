import { describe, expect, it } from 'vitest'
import * as workspaceDomain from './workspace'

type ActivityEntry = {
  sequence: number
  occurredAt: string
  taskId: string
  taskTitle: string
  event: {
    kind: string
    [key: string]: unknown
  }
}

type ActivityDomain = {
  deriveTaskActivityEntries?: (
    before: unknown,
    after: unknown,
    action: unknown,
    occurredAt: string,
  ) => ActivityEntry[]
  describeTaskActivityEntry?: (
    entry: ActivityEntry,
  ) => string
}

const domain = workspaceDomain as ActivityDomain

const projectPlanning = {
  id: 'project-planning',
  name: 'Planning',
}

const projectLaunch = {
  id: 'project-launch',
  name: 'Launch',
}

const listThisWeek = {
  id: 'list-week',
  projectId: projectPlanning.id,
  name: 'This week',
}

const listReady = {
  id: 'list-ready',
  projectId: projectLaunch.id,
  name: 'Ready',
}

const task = {
  id: 'task-1',
  projectId: projectPlanning.id,
  listId: listThisWeek.id,
  title: 'Prepare slides',
  status: 'todo',
  priority: 'normal',
  startDate: null,
  dueDate: '2026-09-25',
  archivedAt: null,
}

const base = {
  projects: [projectPlanning, projectLaunch],
  lists: [listThisWeek, listReady],
  tasks: [task],
  activity: [],
}

describe('Task activity history domain', () => {
  it('derives a title change with a stable sequence and captured values', () => {
    const derive = domain.deriveTaskActivityEntries
    const describe = domain.describeTaskActivityEntry

    expect(derive).toBeTypeOf('function')
    expect(describe).toBeTypeOf('function')

    if (!derive || !describe) {
      return
    }

    const after = {
      ...base,
      tasks: [
        {
          ...task,
          title: 'Prepare demo',
        },
      ],
    }

    const entries = derive(
      base,
      after,
      {
        type: 'task/titleChanged',
        taskId: task.id,
        title: 'Prepare demo',
      },
      '2026-09-23T09:00:00.000Z',
    )

    expect(entries).toEqual([
      {
        sequence: 1,
        occurredAt: '2026-09-23T09:00:00.000Z',
        taskId: task.id,
        taskTitle: 'Prepare demo',
        event: {
          kind: 'task.titleChanged',
          from: 'Prepare slides',
          to: 'Prepare demo',
        },
      },
    ])

    expect(describe(entries[0]!)).toBe(
      'Renamed “Prepare slides” to “Prepare demo”',
    )
  })

  it('derives the direct Task lifecycle event kinds from before and after state', () => {
    const derive = domain.deriveTaskActivityEntries

    expect(derive).toBeTypeOf('function')

    if (!derive) {
      return
    }

    const at = '2026-09-23T09:00:00.000Z'

    const created = {
      ...task,
      id: 'task-created',
      projectId: projectLaunch.id,
      listId: listReady.id,
      title: 'Prepare demo',
    }

    const cases: Array<{
      before: unknown
      after: unknown
      action: unknown
      kind: string
    }> = [
      {
        before: base,
        after: {
          ...base,
          tasks: [...base.tasks, created],
        },
        action: {
          type: 'task/added',
          task: created,
        },
        kind: 'task.created',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [{ ...task, status: 'done' }],
        },
        action: {
          type: 'task/statusChanged',
          taskId: task.id,
          status: 'done',
        },
        kind: 'task.statusChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [{ ...task, priority: 'high' }],
        },
        action: {
          type: 'task/priorityChanged',
          taskId: task.id,
          priority: 'high',
        },
        kind: 'task.priorityChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [{ ...task, startDate: '2026-09-24' }],
        },
        action: {
          type: 'task/startDateChanged',
          taskId: task.id,
          startDate: '2026-09-24',
        },
        kind: 'task.startDateChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [{ ...task, dueDate: null }],
        },
        action: {
          type: 'task/dueDateChanged',
          taskId: task.id,
          dueDate: null,
        },
        kind: 'task.dueDateChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [
            {
              ...task,
              projectId: projectLaunch.id,
              listId: undefined,
            },
          ],
        },
        action: {
          type: 'task/projectChanged',
          taskId: task.id,
          projectId: projectLaunch.id,
        },
        kind: 'task.projectChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [
            {
              ...task,
              listId: undefined,
            },
          ],
        },
        action: {
          type: 'task/listChanged',
          taskId: task.id,
          listId: null,
        },
        kind: 'task.listChanged',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [
            {
              ...task,
              archivedAt: at,
            },
          ],
        },
        action: {
          type: 'task/archived',
          taskId: task.id,
          archivedAt: at,
        },
        kind: 'task.archived',
      },
      {
        before: {
          ...base,
          tasks: [
            {
              ...task,
              archivedAt: at,
            },
          ],
        },
        after: base,
        action: {
          type: 'task/restored',
          taskId: task.id,
        },
        kind: 'task.restored',
      },
      {
        before: base,
        after: {
          ...base,
          tasks: [],
        },
        action: {
          type: 'task/deleted',
          taskId: task.id,
        },
        kind: 'task.deleted',
      },
    ]

    for (const testCase of cases) {
      expect(
        derive(
          testCase.before,
          testCase.after,
          testCase.action,
          at,
        ).map((entry) => entry.event.kind),
      ).toEqual([testCase.kind])
    }
  })

  it('rejects non-canonical timestamps and omits no-op activity', () => {
    const derive = domain.deriveTaskActivityEntries

    expect(derive).toBeTypeOf('function')

    if (!derive) {
      return
    }

    expect(
      derive(
        base,
        base,
        {
          type: 'task/titleChanged',
          taskId: task.id,
          title: task.title,
        },
        '2026-09-23T09:00:00.000Z',
      ),
    ).toEqual([])

    expect(() =>
      derive(
        base,
        {
          ...base,
          tasks: [{ ...task, status: 'done' }],
        },
        {
          type: 'task/statusChanged',
          taskId: task.id,
          status: 'done',
        },
        '2026-09-23 09:00:00Z',
      ),
    ).toThrow(
      'Task activity timestamp must be a canonical ISO instant',
    )
  })
})
