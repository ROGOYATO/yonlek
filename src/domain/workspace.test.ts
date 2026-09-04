import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { emptyWorkspace, workspaceReducer } from './workspace'

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

describe('workspaceReducer', () => {
  it('adds a project', () => {
    const state = workspaceReducer(emptyWorkspace, {
      type: 'project/added',
      project,
    })

    expect(state.projects).toEqual([project])
  })

  it('adds a task only when its project exists', () => {
    const withProject = workspaceReducer(emptyWorkspace, {
      type: 'project/added',
      project,
    })

    const withTask = workspaceReducer(withProject, {
      type: 'task/added',
      task,
    })

    expect(withTask.tasks).toEqual([task])
    expect(() =>
      workspaceReducer(emptyWorkspace, {
        type: 'task/added',
        task,
      }),
    ).toThrow('Cannot add a task to a missing project')
  })

  it('changes task status without mutating the previous state', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'task/statusChanged',
      taskId: task.id,
      status: 'doing',
    })

    expect(next.tasks[0]?.status).toBe('doing')
    expect(state.tasks[0]?.status).toBe('todo')
  })

  it('deleting a project also deletes its tasks', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'project/deleted',
      projectId: project.id,
    })

    expect(next).toEqual({ projects: [], tasks: [] })
  })
})

it('renames a task without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/titleChanged',
    taskId: task.id,
    title: '  Review experiment plan  ',
  })

  expect(next.tasks[0]?.title).toBe('Review experiment plan')
  expect(state.tasks[0]?.title).toBe('Draft experiment plan')
})

it('changes task priority without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/priorityChanged',
    taskId: task.id,
    priority: 'high',
  })

  expect(next.tasks[0]?.priority).toBe('high')
  expect(state.tasks[0]?.priority).toBe('normal')
})

it('deletes a task without deleting its project', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/deleted',
    taskId: task.id,
  })

  expect(next.projects).toEqual([project])
  expect(next.tasks).toEqual([])
  expect(state.tasks).toEqual([task])
})


it('renames a project without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'project/nameChanged',
    projectId: project.id,
    name: '  Autonomy Lab  ',
  } as never)

  expect(next.projects[0]?.name).toBe('Autonomy Lab')
  expect(state.projects[0]?.name).toBe('Robotics Research')
})


it('changes a task due date without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/dueDateChanged',
    taskId: task.id,
    dueDate: '2026-09-12',
  } as never)

  expect(next.tasks[0]?.dueDate).toBe('2026-09-12')
  expect(state.tasks[0]).not.toHaveProperty('dueDate')
})


it('changes a task description without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/descriptionChanged',
    taskId: task.id,
    description: '  Prepare the camera calibration procedure.  ',
  } as never)

  expect(next.tasks[0]?.description).toBe(
    'Prepare the camera calibration procedure.',
  )
  expect(state.tasks[0]).not.toHaveProperty('description')
})


it('moves a task to an existing project without mutating the previous state', () => {
  const field = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-03T16:20:00.000Z',
  })
  const state = {
    projects: [project, field],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'task/projectChanged',
    taskId: task.id,
    projectId: field.id,
  } as never)

  expect(next.tasks[0]?.projectId).toBe(field.id)
  expect(state.tasks[0]?.projectId).toBe(project.id)
})

it('rejects moving a task to a missing project', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  expect(() =>
    workspaceReducer(state, {
      type: 'task/projectChanged',
      taskId: task.id,
      projectId: 'missing-project',
    } as never),
  ).toThrow('Cannot move a task to a missing project')
})


it('changes a project description without mutating the previous state', () => {
  const state = {
    projects: [project],
    tasks: [task],
  }

  const next = workspaceReducer(state, {
    type: 'project/descriptionChanged',
    projectId: project.id,
    description: '  Camera-guided robotics experiments.  ',
  } as never)

  expect(next.projects[0]?.description).toBe(
    'Camera-guided robotics experiments.',
  )
  expect(state.projects[0]).not.toHaveProperty('description')
})


describe('workspace areas', () => {
  const area = {
    id: 'area-1',
    name: 'Engineering',
    createdAt: '2026-09-03T19:00:00.000Z',
  }

  it('adds an area', () => {
    const next = workspaceReducer(
      { areas: [], projects: [], tasks: [] },
      { type: 'area/added', area } as never,
    )

    expect(next.areas).toEqual([area])
  })

  it('renames an area without mutating the previous state', () => {
    const state = { areas: [area], projects: [], tasks: [] }

    const next = workspaceReducer(state, {
      type: 'area/nameChanged',
      areaId: area.id,
      name: 'Robotics',
    } as never)

    expect(next.areas?.[0]?.name).toBe('Robotics')
    expect(state.areas[0]?.name).toBe('Engineering')
  })

  it('deletes an area without deleting projects or tasks', () => {
    const state = {
      areas: [area],
      projects: [project],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'area/deleted',
      areaId: area.id,
    } as never)

    expect(next.areas).toEqual([])
    expect(next.projects).toEqual([project])
    expect(next.tasks).toEqual([task])
  })
})


describe('project area relationships', () => {
  const area = {
    id: 'area-1',
    name: 'Engineering',
    createdAt: '2026-09-03T19:10:00.000Z',
  }

  it('assigns a project to an existing area', () => {
    const state = {
      areas: [area],
      projects: [project],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'project/areaChanged',
      projectId: project.id,
      areaId: area.id,
    } as never)

    expect(next.projects[0]?.areaId).toBe(area.id)
    expect(state.projects[0]).not.toHaveProperty('areaId')
  })

  it('rejects assigning a project to a missing area', () => {
    expect(() =>
      workspaceReducer(
        {
          areas: [area],
          projects: [project],
          tasks: [task],
        },
        {
          type: 'project/areaChanged',
          projectId: project.id,
          areaId: 'missing-area',
        } as never,
      ),
    ).toThrow('Cannot move a project to a missing area')
  })

  it('unassigns projects when their area is deleted', () => {
    const assignedProject = { ...project, areaId: area.id }

    const next = workspaceReducer(
      {
        areas: [area],
        projects: [assignedProject],
        tasks: [task],
      },
      { type: 'area/deleted', areaId: area.id } as never,
    )

    expect(next.areas).toEqual([])
    expect(next.projects[0]).not.toHaveProperty('areaId')
    expect(next.tasks).toEqual([task])
  })
})


describe('workspace lists', () => {
  const list = {
    id: 'list-1',
    projectId: project.id,
    name: 'Backlog',
    createdAt: '2026-09-04T03:20:00.000Z',
  }

  it('adds a list only when its project exists', () => {
    const next = workspaceReducer(
      { projects: [project], tasks: [] },
      { type: 'list/added', list } as never,
    )

    expect(next.lists).toEqual([list])

    expect(() =>
      workspaceReducer(
        { projects: [], tasks: [] },
        { type: 'list/added', list } as never,
      ),
    ).toThrow('Cannot add a list to a missing project')
  })

  it('renames a list without mutating the previous state', () => {
    const state = {
      lists: [list],
      projects: [project],
      tasks: [],
    }

    const next = workspaceReducer(state, {
      type: 'list/nameChanged',
      listId: list.id,
      name: 'Sprint 1',
    } as never)

    expect(next.lists?.[0]?.name).toBe('Sprint 1')
    expect(state.lists[0]?.name).toBe('Backlog')
  })

  it('deleting a list keeps its tasks and removes their list assignment', () => {
    const listedTask = { ...task, listId: list.id }
    const state = {
      lists: [list],
      projects: [project],
      tasks: [listedTask],
    }

    const next = workspaceReducer(state, {
      type: 'list/deleted',
      listId: list.id,
    } as never)

    expect(next.lists).toEqual([])
    expect(next.tasks[0]?.id).toBe(task.id)
    expect(next.tasks[0]).not.toHaveProperty('listId')
  })

  it('deleting a project removes its lists and tasks but preserves areas', () => {
    const area = {
      id: 'area-1',
      name: 'Engineering',
      createdAt: '2026-09-04T03:21:00.000Z',
    }
    const listedProject = { ...project, areaId: area.id }
    const listedTask = { ...task, listId: list.id }

    const next = workspaceReducer(
      {
        areas: [area],
        lists: [list],
        projects: [listedProject],
        tasks: [listedTask],
      },
      { type: 'project/deleted', projectId: project.id },
    )

    expect(next.areas).toEqual([area])
    expect(next.lists).toEqual([])
    expect(next.projects).toEqual([])
    expect(next.tasks).toEqual([])
  })
})


describe('task list relationships', () => {
  const backlog = {
    id: 'list-1',
    projectId: project.id,
    name: 'Backlog',
    createdAt: '2026-09-04T03:30:00.000Z',
  }
  const otherProject = createProject({
    id: 'project-2',
    name: 'Field Tests',
    now: '2026-09-04T03:31:00.000Z',
  })
  const otherList = {
    id: 'list-2',
    projectId: otherProject.id,
    name: 'Field',
    createdAt: '2026-09-04T03:32:00.000Z',
  }

  it('assigns a task only to a list in the same project', () => {
    const state = {
      lists: [backlog, otherList],
      projects: [project, otherProject],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'task/listChanged',
      taskId: task.id,
      listId: backlog.id,
    } as never)

    expect(next.tasks[0]?.listId).toBe(backlog.id)

    expect(() =>
      workspaceReducer(state, {
        type: 'task/listChanged',
        taskId: task.id,
        listId: otherList.id,
      } as never),
    ).toThrow('Cannot assign a task to a list from another project')
  })

  it('rejects assigning a task to a missing list', () => {
    expect(() =>
      workspaceReducer(
        {
          lists: [backlog],
          projects: [project],
          tasks: [task],
        },
        {
          type: 'task/listChanged',
          taskId: task.id,
          listId: 'missing-list',
        } as never,
      ),
    ).toThrow('Cannot assign a task to a missing list')
  })

  it('clears an incompatible list when a task moves to another project', () => {
    const listedTask = { ...task, listId: backlog.id }

    const next = workspaceReducer(
      {
        lists: [backlog],
        projects: [project, otherProject],
        tasks: [listedTask],
      },
      {
        type: 'task/projectChanged',
        taskId: task.id,
        projectId: otherProject.id,
      },
    )

    expect(next.tasks[0]?.projectId).toBe(otherProject.id)
    expect(next.tasks[0]).not.toHaveProperty('listId')
  })
})


describe('subtask relationships', () => {
  const parentTask = task
  const childTask = {
    ...task,
    id: 'task-2',
    title: 'Calibrate camera',
    parentTaskId: task.id,
  }

  it('adds a subtask only when its parent exists in the same project', () => {
    const state = {
      projects: [project],
      tasks: [parentTask],
    }

    const next = workspaceReducer(state, {
      type: 'task/added',
      task: childTask,
    })

    expect(next.tasks[1]?.parentTaskId).toBe(parentTask.id)

    expect(() =>
      workspaceReducer(
        { projects: [project], tasks: [] },
        { type: 'task/added', task: childTask },
      ),
    ).toThrow('Cannot add a subtask to a missing parent task')
  })

  it('rejects a subtask whose parent is in another project', () => {
    const otherProject = createProject({
      id: 'project-2',
      name: 'Field Tests',
      now: '2026-09-04T04:40:00.000Z',
    })
    const wrongProjectChild = {
      ...childTask,
      projectId: otherProject.id,
    }

    expect(() =>
      workspaceReducer(
        {
          projects: [project, otherProject],
          tasks: [parentTask],
        },
        { type: 'task/added', task: wrongProjectChild },
      ),
    ).toThrow('Cannot add a subtask to a parent from another project')
  })

  it('deleting a parent task cascades through its descendants', () => {
    const grandchild = {
      ...task,
      id: 'task-3',
      title: 'Tune exposure',
      parentTaskId: childTask.id,
    }

    const next = workspaceReducer(
      {
        projects: [project],
        tasks: [parentTask, childTask, grandchild],
      },
      { type: 'task/deleted', taskId: parentTask.id },
    )

    expect(next.tasks).toEqual([])
  })
})


describe('subtask project moves', () => {
  it('moves descendants with their parent and clears incompatible list assignments', () => {
    const otherProject = createProject({
      id: 'project-2',
      name: 'Field Tests',
      now: '2026-09-04T05:20:00.000Z',
    })
    const list = {
      id: 'list-1',
      projectId: project.id,
      name: 'Backlog',
      createdAt: '2026-09-04T05:21:00.000Z',
    }
    const parent = { ...task, listId: list.id }
    const child = {
      ...task,
      id: 'task-2',
      title: 'Calibrate camera',
      listId: list.id,
      parentTaskId: parent.id,
    }
    const grandchild = {
      ...task,
      id: 'task-3',
      title: 'Tune exposure',
      listId: list.id,
      parentTaskId: child.id,
    }

    const next = workspaceReducer(
      {
        lists: [list],
        projects: [project, otherProject],
        tasks: [parent, child, grandchild],
      },
      {
        type: 'task/projectChanged',
        taskId: parent.id,
        projectId: otherProject.id,
      },
    )

    expect(next.tasks.map((item) => item.projectId)).toEqual([
      otherProject.id,
      otherProject.id,
      otherProject.id,
    ])
    expect(next.tasks.every((item) => item.listId === undefined)).toBe(true)
  })

  it('rejects moving a subtask away from its parent project by itself', () => {
    const otherProject = createProject({
      id: 'project-2',
      name: 'Field Tests',
      now: '2026-09-04T05:22:00.000Z',
    })
    const child = {
      ...task,
      id: 'task-2',
      title: 'Calibrate camera',
      parentTaskId: task.id,
    }

    expect(() =>
      workspaceReducer(
        {
          projects: [project, otherProject],
          tasks: [task, child],
        },
        {
          type: 'task/projectChanged',
          taskId: child.id,
          projectId: otherProject.id,
        },
      ),
    ).toThrow('Cannot move a subtask away from its parent project')
  })
})


describe('task checklists', () => {
  const item = {
    id: 'check-1',
    text: 'Review safety notes',
    completed: false,
  }

  it('adds a checklist item to an existing task and rejects a missing task', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const next = workspaceReducer(state, {
      type: 'task/checklistItemAdded',
      taskId: task.id,
      item,
    } as never)

    expect(next.tasks[0]?.checklist).toEqual([item])

    expect(() =>
      workspaceReducer(state, {
        type: 'task/checklistItemAdded',
        taskId: 'missing-task',
        item,
      } as never),
    ).toThrow('Cannot add a checklist item to a missing task')
  })

  it('rejects duplicate checklist item ids within one task', () => {
    const listedTask = { ...task, checklist: [item] }

    expect(() =>
      workspaceReducer(
        {
          projects: [project],
          tasks: [listedTask],
        },
        {
          type: 'task/checklistItemAdded',
          taskId: task.id,
          item: { ...item, text: 'Another item' },
        } as never,
      ),
    ).toThrow('Cannot add a duplicate checklist item')
  })

  it('renames and completes a checklist item without mutating previous state', () => {
    const listedTask = { ...task, checklist: [item] }
    const state = {
      projects: [project],
      tasks: [listedTask],
    }

    const renamed = workspaceReducer(state, {
      type: 'task/checklistItemTextChanged',
      taskId: task.id,
      itemId: item.id,
      text: 'Confirm camera mount',
    } as never)

    const completed = workspaceReducer(renamed, {
      type: 'task/checklistItemCompletedChanged',
      taskId: task.id,
      itemId: item.id,
      completed: true,
    } as never)

    expect(completed.tasks[0]?.checklist?.[0]).toMatchObject({
      text: 'Confirm camera mount',
      completed: true,
    })
    expect(state.tasks[0]?.checklist?.[0]).toEqual(item)
  })

  it('deleting the last checklist item preserves the task and clears the optional field', () => {
    const listedTask = { ...task, checklist: [item] }

    const next = workspaceReducer(
      {
        projects: [project],
        tasks: [listedTask],
      },
      {
        type: 'task/checklistItemDeleted',
        taskId: task.id,
        itemId: item.id,
      } as never,
    )

    expect(next.tasks[0]?.id).toBe(task.id)
    expect(next.tasks[0]).not.toHaveProperty('checklist')
  })
})


describe('manual sibling ordering', () => {
  it('moves areas globally', () => {
    const engineering = {
      id: 'area-1',
      name: 'Engineering',
      createdAt: '2026-09-04T06:20:00.000Z',
    }
    const operations = {
      id: 'area-2',
      name: 'Operations',
      createdAt: '2026-09-04T06:21:00.000Z',
    }

    const next = workspaceReducer(
      {
        areas: [engineering, operations],
        projects: [],
        tasks: [],
      },
      {
        type: 'area/moved',
        areaId: operations.id,
        direction: 'up',
      } as never,
    )

    expect(next.areas?.map((area) => area.id)).toEqual([
      operations.id,
      engineering.id,
    ])
  })

  it('moves projects only among projects in the same area', () => {
    const area = {
      id: 'area-1',
      name: 'Engineering',
      createdAt: '2026-09-04T06:22:00.000Z',
    }
    const first = { ...project, id: 'project-1', areaId: area.id }
    const unrelated = {
      ...project,
      id: 'project-2',
      name: 'Operations',
    }
    const second = {
      ...project,
      id: 'project-3',
      name: 'Controls',
      areaId: area.id,
    }

    const next = workspaceReducer(
      {
        areas: [area],
        projects: [first, unrelated, second],
        tasks: [],
      },
      {
        type: 'project/moved',
        projectId: second.id,
        direction: 'up',
      } as never,
    )

    expect(next.projects.map((item) => item.id)).toEqual([
      second.id,
      unrelated.id,
      first.id,
    ])
  })

  it('moves lists only among lists in the same project', () => {
    const otherProject = createProject({
      id: 'project-2',
      name: 'Field Tests',
      now: '2026-09-04T06:23:00.000Z',
    })
    const first = {
      id: 'list-1',
      projectId: project.id,
      name: 'Backlog',
      createdAt: '2026-09-04T06:24:00.000Z',
    }
    const unrelated = {
      id: 'list-2',
      projectId: otherProject.id,
      name: 'Field Queue',
      createdAt: '2026-09-04T06:25:00.000Z',
    }
    const second = {
      id: 'list-3',
      projectId: project.id,
      name: 'Sprint 1',
      createdAt: '2026-09-04T06:26:00.000Z',
    }

    const next = workspaceReducer(
      {
        lists: [first, unrelated, second],
        projects: [project, otherProject],
        tasks: [],
      },
      {
        type: 'list/moved',
        listId: second.id,
        direction: 'up',
      } as never,
    )

    expect(next.lists?.map((list) => list.id)).toEqual([
      second.id,
      unrelated.id,
      first.id,
    ])
  })

  it('moves tasks only among siblings in the same project list and parent', () => {
    const list = {
      id: 'list-1',
      projectId: project.id,
      name: 'Backlog',
      createdAt: '2026-09-04T06:27:00.000Z',
    }
    const otherList = {
      id: 'list-2',
      projectId: project.id,
      name: 'Sprint 1',
      createdAt: '2026-09-04T06:28:00.000Z',
    }
    const first = { ...task, id: 'task-1', listId: list.id }
    const unrelated = {
      ...task,
      id: 'task-2',
      title: 'Unrelated',
      listId: otherList.id,
    }
    const second = {
      ...task,
      id: 'task-3',
      title: 'Second sibling',
      listId: list.id,
    }

    const next = workspaceReducer(
      {
        lists: [list, otherList],
        projects: [project],
        tasks: [first, unrelated, second],
      },
      {
        type: 'task/moved',
        taskId: second.id,
        direction: 'up',
      } as never,
    )

    expect(next.tasks.map((item) => item.id)).toEqual([
      second.id,
      unrelated.id,
      first.id,
    ])
  })

  it('moves checklist items only inside their task', () => {
    const first = {
      id: 'check-1',
      text: 'Review safety notes',
      completed: false,
    }
    const second = {
      id: 'check-2',
      text: 'Confirm camera mount',
      completed: false,
    }
    const listedTask = {
      ...task,
      checklist: [first, second],
    }

    const next = workspaceReducer(
      {
        projects: [project],
        tasks: [listedTask],
      },
      {
        type: 'task/checklistItemMoved',
        taskId: task.id,
        itemId: second.id,
        direction: 'up',
      } as never,
    )

    expect(
      next.tasks[0]?.checklist?.map((item) => item.id),
    ).toEqual([second.id, first.id])
  })
})


describe('workspace tags', () => {
  const safety = {
    id: 'tag-1',
    name: 'Safety',
    createdAt: '2026-09-04T07:20:00.000Z',
  }

  it('adds and renames a tag without mutating previous state', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const added = workspaceReducer(state, {
      type: 'tag/added',
      tag: safety,
    } as never)
    const renamed = workspaceReducer(added, {
      type: 'tag/nameChanged',
      tagId: safety.id,
      name: 'Camera',
    } as never)

    expect(added.tags).toEqual([safety])
    expect(renamed.tags?.[0]?.name).toBe('Camera')
    expect(state).not.toHaveProperty('tags')
    expect(safety.name).toBe('Safety')
  })

  it('deleting a tag preserves tasks and removes their assignment', () => {
    const taggedTask = { ...task, tagIds: [safety.id] }

    const next = workspaceReducer(
      {
        tags: [safety],
        projects: [project],
        tasks: [taggedTask],
      },
      {
        type: 'tag/deleted',
        tagId: safety.id,
      } as never,
    )

    expect(next.tasks[0]?.id).toBe(task.id)
    expect(next.tasks[0]).not.toHaveProperty('tagIds')
  })

  it('deleting the final tag removes the optional tag collection', () => {
    const next = workspaceReducer(
      {
        tags: [safety],
        projects: [project],
        tasks: [task],
      },
      {
        type: 'tag/deleted',
        tagId: safety.id,
      } as never,
    )

    expect(next).not.toHaveProperty('tags')
  })
})


describe('task tag assignments', () => {
  const safety = {
    id: 'tag-1',
    name: 'Safety',
    createdAt: '2026-09-04T07:30:00.000Z',
  }

  it('assigns an existing tag once to an existing task', () => {
    const state = {
      tags: [safety],
      projects: [project],
      tasks: [task],
    }

    const assigned = workspaceReducer(state, {
      type: 'task/tagAdded',
      taskId: task.id,
      tagId: safety.id,
    } as never)
    const assignedAgain = workspaceReducer(assigned, {
      type: 'task/tagAdded',
      taskId: task.id,
      tagId: safety.id,
    } as never)

    expect(assignedAgain.tasks[0]?.tagIds).toEqual([safety.id])
  })

  it('rejects missing tasks and missing tags', () => {
    const state = {
      tags: [safety],
      projects: [project],
      tasks: [task],
    }

    expect(() =>
      workspaceReducer(state, {
        type: 'task/tagAdded',
        taskId: 'missing-task',
        tagId: safety.id,
      } as never),
    ).toThrow('Cannot tag a missing task')

    expect(() =>
      workspaceReducer(state, {
        type: 'task/tagAdded',
        taskId: task.id,
        tagId: 'missing-tag',
      } as never),
    ).toThrow('Cannot assign a missing tag')
  })

  it('removes a task tag and clears the optional field when none remain', () => {
    const taggedTask = { ...task, tagIds: [safety.id] }

    const next = workspaceReducer(
      {
        tags: [safety],
        projects: [project],
        tasks: [taggedTask],
      },
      {
        type: 'task/tagRemoved',
        taskId: task.id,
        tagId: safety.id,
      } as never,
    )

    expect(next.tasks[0]).not.toHaveProperty('tagIds')
  })
})


describe('workspace people', () => {
  const ada = {
    id: 'person-1',
    name: 'Ada Lovelace',
    createdAt: '2026-09-04T08:20:00.000Z',
  }

  it('adds and renames a person without mutating previous state', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const added = workspaceReducer(state, {
      type: 'person/added',
      person: ada,
    } as never)
    const renamed = workspaceReducer(added, {
      type: 'person/nameChanged',
      personId: ada.id,
      name: 'Grace Hopper',
    } as never)

    expect(added.people).toEqual([ada])
    expect(renamed.people?.[0]?.name).toBe('Grace Hopper')
    expect(state).not.toHaveProperty('people')
    expect(ada.name).toBe('Ada Lovelace')
  })

  it('deleting a person preserves tasks and removes their assignment', () => {
    const assignedTask = { ...task, assigneeIds: [ada.id] }

    const next = workspaceReducer(
      {
        people: [ada],
        projects: [project],
        tasks: [assignedTask],
      },
      {
        type: 'person/deleted',
        personId: ada.id,
      } as never,
    )

    expect(next.tasks[0]?.id).toBe(task.id)
    expect(next.tasks[0]).not.toHaveProperty('assigneeIds')
  })

  it('deleting the final person removes the optional people collection', () => {
    const next = workspaceReducer(
      {
        people: [ada],
        projects: [project],
        tasks: [task],
      },
      {
        type: 'person/deleted',
        personId: ada.id,
      } as never,
    )

    expect(next).not.toHaveProperty('people')
  })
})


describe('task assignees', () => {
  const ada = {
    id: 'person-1',
    name: 'Ada Lovelace',
    createdAt: '2026-09-04T08:30:00.000Z',
  }

  it('assigns an existing person once to an existing task', () => {
    const state = {
      people: [ada],
      projects: [project],
      tasks: [task],
    }

    const assigned = workspaceReducer(state, {
      type: 'task/assigneeAdded',
      taskId: task.id,
      personId: ada.id,
    } as never)
    const assignedAgain = workspaceReducer(assigned, {
      type: 'task/assigneeAdded',
      taskId: task.id,
      personId: ada.id,
    } as never)

    expect(assignedAgain.tasks[0]?.assigneeIds).toEqual([ada.id])
  })

  it('rejects missing tasks and missing people', () => {
    const state = {
      people: [ada],
      projects: [project],
      tasks: [task],
    }

    expect(() =>
      workspaceReducer(state, {
        type: 'task/assigneeAdded',
        taskId: 'missing-task',
        personId: ada.id,
      } as never),
    ).toThrow('Cannot assign a missing task')

    expect(() =>
      workspaceReducer(state, {
        type: 'task/assigneeAdded',
        taskId: task.id,
        personId: 'missing-person',
      } as never),
    ).toThrow('Cannot assign a missing person')
  })

  it('removes an assignee and clears the optional field when none remain', () => {
    const assignedTask = { ...task, assigneeIds: [ada.id] }

    const next = workspaceReducer(
      {
        people: [ada],
        projects: [project],
        tasks: [assignedTask],
      },
      {
        type: 'task/assigneeRemoved',
        taskId: task.id,
        personId: ada.id,
      } as never,
    )

    expect(next.tasks[0]).not.toHaveProperty('assigneeIds')
  })
})


describe('workspace custom fields', () => {
  const notes = {
    id: 'field-1',
    name: 'Notes',
    type: 'text' as const,
    createdAt: '2026-09-04T09:20:00.000Z',
  }

  it('adds and renames a custom field without mutating previous state', () => {
    const state = {
      projects: [project],
      tasks: [task],
    }

    const added = workspaceReducer(state, {
      type: 'customField/added',
      field: notes,
    } as never)
    const renamed = workspaceReducer(added, {
      type: 'customField/nameChanged',
      fieldId: notes.id,
      name: 'Findings',
    } as never)

    expect(added.customFields).toEqual([notes])
    expect(renamed.customFields?.[0]?.name).toBe('Findings')
    expect(state).not.toHaveProperty('customFields')
  })

  it('deleting a custom field preserves tasks and removes its values', () => {
    const valuedTask = {
      ...task,
      customFieldValues: {
        [notes.id]: 'Inspect mount',
      },
    }

    const next = workspaceReducer(
      {
        customFields: [notes],
        projects: [project],
        tasks: [valuedTask],
      },
      {
        type: 'customField/deleted',
        fieldId: notes.id,
      } as never,
    )

    expect(next.tasks[0]?.id).toBe(task.id)
    expect(next.tasks[0]).not.toHaveProperty('customFieldValues')
  })

  it('deleting the final custom field removes the optional collection', () => {
    const next = workspaceReducer(
      {
        customFields: [notes],
        projects: [project],
        tasks: [task],
      },
      {
        type: 'customField/deleted',
        fieldId: notes.id,
      } as never,
    )

    expect(next).not.toHaveProperty('customFields')
  })
})


describe('task custom field values', () => {
  const notes = {
    id: 'field-text',
    name: 'Notes',
    type: 'text' as const,
    createdAt: '2026-09-04T09:30:00.000Z',
  }
  const estimate = {
    id: 'field-number',
    name: 'Estimate',
    type: 'number' as const,
    createdAt: '2026-09-04T09:31:00.000Z',
  }
  const reviewed = {
    id: 'field-checkbox',
    name: 'Reviewed',
    type: 'checkbox' as const,
    createdAt: '2026-09-04T09:32:00.000Z',
  }

  it('sets typed values on an existing task', () => {
    let state = {
      customFields: [notes, estimate, reviewed],
      projects: [project],
      tasks: [task],
    }

    state = workspaceReducer(state, {
      type: 'task/customFieldValueChanged',
      taskId: task.id,
      fieldId: notes.id,
      value: '  Inspect mount  ',
    } as never) as typeof state
    state = workspaceReducer(state, {
      type: 'task/customFieldValueChanged',
      taskId: task.id,
      fieldId: estimate.id,
      value: 3.5,
    } as never) as typeof state
    state = workspaceReducer(state, {
      type: 'task/customFieldValueChanged',
      taskId: task.id,
      fieldId: reviewed.id,
      value: true,
    } as never) as typeof state

    expect(state.tasks[0]?.customFieldValues).toEqual({
      [notes.id]: 'Inspect mount',
      [estimate.id]: 3.5,
      [reviewed.id]: true,
    })
  })

  it('rejects values that do not match the definition type', () => {
    expect(() =>
      workspaceReducer(
        {
          customFields: [estimate],
          projects: [project],
          tasks: [task],
        },
        {
          type: 'task/customFieldValueChanged',
          taskId: task.id,
          fieldId: estimate.id,
          value: '3.5',
        } as never,
      ),
    ).toThrow('Custom field value does not match field type')
  })

  it('rejects a missing task or missing custom field', () => {
    const state = {
      customFields: [notes],
      projects: [project],
      tasks: [task],
    }

    expect(() =>
      workspaceReducer(state, {
        type: 'task/customFieldValueChanged',
        taskId: 'missing-task',
        fieldId: notes.id,
        value: 'hello',
      } as never),
    ).toThrow('Cannot set a custom field on a missing task')

    expect(() =>
      workspaceReducer(state, {
        type: 'task/customFieldValueChanged',
        taskId: task.id,
        fieldId: 'missing-field',
        value: 'hello',
      } as never),
    ).toThrow('Cannot set a missing custom field')
  })

  it('clears a value and removes the optional value map when empty', () => {
    const valuedTask = {
      ...task,
      customFieldValues: {
        [notes.id]: 'Inspect mount',
      },
    }

    const next = workspaceReducer(
      {
        customFields: [notes],
        projects: [project],
        tasks: [valuedTask],
      },
      {
        type: 'task/customFieldValueChanged',
        taskId: task.id,
        fieldId: notes.id,
        value: null,
      } as never,
    )

    expect(next.tasks[0]).not.toHaveProperty('customFieldValues')
  })
})
