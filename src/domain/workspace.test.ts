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
