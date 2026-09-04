import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import { emptyWorkspace } from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('workspace storage', () => {
  it('returns an empty workspace when nothing has been saved', () => {
    expect(loadWorkspace(new MemoryStore())).toEqual(emptyWorkspace)
  })

  it('round-trips a workspace through a versioned stored document', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T00:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-03T00:05:00.000Z',
    })
    const workspace = { projects: [project], tasks: [task] }
    const store = new MemoryStore()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })
})


it('reports malformed JSON as invalid workspace storage', () => {
  const store: KeyValueStore = {
    getItem: () => '{not-json',
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects a versioned document without workspace arrays', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: {},
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('still reports unsupported storage versions separately', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 2,
        workspace: {
          projects: [],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow(
    'Unsupported workspace storage version',
  )
})


it('rejects an invalid persisted project record', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 42,
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted task status', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'blocked',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects an invalid persisted task priority', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'urgent',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted task due date', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              dueDate: '2026-02-31',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects a non-string persisted task description', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              description: 123,
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects a persisted task whose project is missing', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [],
          tasks: [
            {
              id: 'task-1',
              projectId: 'missing-project',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('loads valid optional due dates and descriptions', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              dueDate: '2026-09-12',
              description: 'Prepare the calibration procedure.',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(loadWorkspace(store).tasks[0]).toMatchObject({
    dueDate: '2026-09-12',
    description: 'Prepare the calibration procedure.',
  })
})


it('rejects duplicate persisted project ids', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T15:40:00.000Z',
            },
            {
              id: 'project-1',
              name: 'Field Tests',
              createdAt: '2026-09-03T15:41:00.000Z',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects duplicate persisted task ids', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T15:50:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T15:51:00.000Z',
            },
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Review safety checklist',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T15:52:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted project creation timestamp', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: 'not-a-timestamp',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects an invalid persisted task creation timestamp', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T16:00:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-02-31T16:01:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects a non-string persisted project description', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T17:10:00.000Z',
              description: 123,
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('loads a valid optional project description', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T17:11:00.000Z',
              description: 'Camera-guided robotics experiments.',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(loadWorkspace(store).projects[0]?.description).toBe(
    'Camera-guided robotics experiments.',
  )
})


describe('area persistence', () => {
  it('round-trips areas and project area assignments', () => {
    const store = new MemoryStore()
    const workspace = {
      areas: [
        {
          id: 'area-1',
          name: 'Engineering',
          createdAt: '2026-09-03T19:40:00.000Z',
        },
      ],
      projects: [
        {
          id: 'project-1',
          name: 'Robotics Research',
          createdAt: '2026-09-03T19:41:00.000Z',
          areaId: 'area-1',
        },
      ],
      tasks: [],
    }

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('rejects an invalid persisted area record', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            areas: [
              {
                id: 'area-1',
                name: 42,
                createdAt: '2026-09-03T19:40:00.000Z',
              },
            ],
            projects: [],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate persisted area ids', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            areas: [
              {
                id: 'area-1',
                name: 'Engineering',
                createdAt: '2026-09-03T19:40:00.000Z',
              },
              {
                id: 'area-1',
                name: 'Operations',
                createdAt: '2026-09-03T19:41:00.000Z',
              },
            ],
            projects: [],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a project that references a missing area', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            areas: [],
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-03T19:41:00.000Z',
                areaId: 'missing-area',
              },
            ],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})


describe('list persistence', () => {
  const storedList = {
    id: 'list-1',
    projectId: 'project-1',
    name: 'Backlog',
    createdAt: '2026-09-04T04:00:00.000Z',
  }

  it('round-trips lists and task list assignments', () => {
    const store = new MemoryStore()
    const workspace = {
      lists: [storedList],
      projects: [
        {
          id: 'project-1',
          name: 'Robotics Research',
          createdAt: '2026-09-04T04:00:00.000Z',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          projectId: 'project-1',
          listId: 'list-1',
          title: 'Draft experiment plan',
          status: 'todo' as const,
          priority: 'normal' as const,
          createdAt: '2026-09-04T04:01:00.000Z',
        },
      ],
    }

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('rejects invalid and duplicate persisted lists', () => {
    const invalid: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            lists: [
              {
                id: 'list-1',
                projectId: 'project-1',
                name: 42,
                createdAt: '2026-09-04T04:00:00.000Z',
              },
            ],
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-04T04:00:00.000Z',
              },
            ],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    const duplicate: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            lists: [storedList, { ...storedList, name: 'Sprint 1' }],
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-04T04:00:00.000Z',
              },
            ],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(invalid)).toThrow('Workspace storage is invalid')
    expect(() => loadWorkspace(duplicate)).toThrow('Workspace storage is invalid')
  })

  it('rejects a list whose project is missing', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            lists: [storedList],
            projects: [],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a task that references a missing list', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            lists: [],
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-04T04:00:00.000Z',
              },
            ],
            tasks: [
              {
                id: 'task-1',
                projectId: 'project-1',
                listId: 'missing-list',
                title: 'Draft experiment plan',
                status: 'todo',
                priority: 'normal',
                createdAt: '2026-09-04T04:01:00.000Z',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a task whose list belongs to another project', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            lists: [storedList],
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-04T04:00:00.000Z',
              },
              {
                id: 'project-2',
                name: 'Field Tests',
                createdAt: '2026-09-04T04:00:00.000Z',
              },
            ],
            tasks: [
              {
                id: 'task-1',
                projectId: 'project-2',
                listId: 'list-1',
                title: 'Inspect field setup',
                status: 'todo',
                priority: 'normal',
                createdAt: '2026-09-04T04:01:00.000Z',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})


describe('subtask persistence', () => {
  const project = {
    id: 'project-1',
    name: 'Robotics Research',
    createdAt: '2026-09-04T05:10:00.000Z',
  }
  const parent = {
    id: 'task-1',
    projectId: project.id,
    title: 'Draft experiment plan',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-04T05:11:00.000Z',
  }

  it('round-trips a valid parent task relationship', () => {
    const store = new MemoryStore()
    const child = {
      ...parent,
      id: 'task-2',
      title: 'Calibrate camera',
      parentTaskId: parent.id,
    }

    saveWorkspace(store, {
      projects: [project],
      tasks: [parent, child],
    })

    expect(loadWorkspace(store).tasks[1]?.parentTaskId).toBe(parent.id)
  })

  it('rejects a subtask whose parent is missing', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [project],
            tasks: [
              {
                ...parent,
                id: 'task-2',
                parentTaskId: 'missing-task',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a subtask whose parent belongs to another project', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [
              project,
              {
                id: 'project-2',
                name: 'Field Tests',
                createdAt: '2026-09-04T05:12:00.000Z',
              },
            ],
            tasks: [
              parent,
              {
                ...parent,
                id: 'task-2',
                projectId: 'project-2',
                parentTaskId: parent.id,
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects task parent cycles', () => {
    const first = { ...parent, parentTaskId: 'task-2' }
    const second = {
      ...parent,
      id: 'task-2',
      title: 'Calibrate camera',
      parentTaskId: parent.id,
    }
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [project],
            tasks: [first, second],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})


describe('checklist persistence', () => {
  const project = {
    id: 'project-1',
    name: 'Robotics Research',
    createdAt: '2026-09-04T06:00:00.000Z',
  }
  const task = {
    id: 'task-1',
    projectId: project.id,
    title: 'Draft experiment plan',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-04T06:01:00.000Z',
  }

  it('round-trips a valid optional checklist', () => {
    const store = new MemoryStore()
    const listedTask = {
      ...task,
      checklist: [
        {
          id: 'check-1',
          text: 'Review safety notes',
          completed: true,
        },
      ],
    }

    saveWorkspace(store, {
      projects: [project],
      tasks: [listedTask],
    })

    expect(loadWorkspace(store).tasks[0]?.checklist).toEqual(
      listedTask.checklist,
    )
  })

  it('rejects an invalid persisted checklist item', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [project],
            tasks: [
              {
                ...task,
                checklist: [
                  {
                    id: 'check-1',
                    text: 42,
                    completed: false,
                  },
                ],
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate checklist item ids within a task', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [project],
            tasks: [
              {
                ...task,
                checklist: [
                  {
                    id: 'check-1',
                    text: 'Review safety notes',
                    completed: false,
                  },
                  {
                    id: 'check-1',
                    text: 'Confirm camera mount',
                    completed: true,
                  },
                ],
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a non-array persisted checklist', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [project],
            tasks: [
              {
                ...task,
                checklist: 'not-an-array',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})


describe('tag persistence', () => {
  const tag = {
    id: 'tag-1',
    name: 'Safety',
    createdAt: '2026-09-04T08:00:00.000Z',
  }
  const project = {
    id: 'project-1',
    name: 'Robotics Research',
    createdAt: '2026-09-04T08:01:00.000Z',
  }
  const task = {
    id: 'task-1',
    projectId: project.id,
    title: 'Draft experiment plan',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-04T08:02:00.000Z',
  }

  it('round-trips tags and task tag assignments', () => {
    const store = new MemoryStore()
    const taggedTask = { ...task, tagIds: [tag.id] }
    const workspace = {
      tags: [tag],
      projects: [project],
      tasks: [taggedTask],
    }

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('rejects an invalid persisted tag record', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            tags: [
              {
                id: 'tag-1',
                name: 42,
                createdAt: '2026-09-04T08:00:00.000Z',
              },
            ],
            projects: [project],
            tasks: [task],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate persisted tag ids', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            tags: [tag, { ...tag, name: 'Camera' }],
            projects: [project],
            tasks: [task],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects a task that references a missing tag', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            tags: [],
            projects: [project],
            tasks: [{ ...task, tagIds: ['missing-tag'] }],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate task tag ids', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            tags: [tag],
            projects: [project],
            tasks: [{ ...task, tagIds: [tag.id, tag.id] }],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})
