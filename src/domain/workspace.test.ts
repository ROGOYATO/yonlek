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
