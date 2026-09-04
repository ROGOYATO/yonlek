import { describe, expect, it } from 'vitest'

import { loadWorkspace, type KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('workspace commands', () => {
  it('creates projects and tasks using injected ids and timestamps', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const timestamps = [
      '2026-09-03T01:00:00.000Z',
      '2026-09-03T01:05:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })

    const project = commands.addProject('  Robotics Research  ')
    const task = commands.addTask(project.id, '  Draft experiment plan  ')

    expect(project).toEqual({
      id: 'project-1',
      name: 'Robotics Research',
      createdAt: '2026-09-03T01:00:00.000Z',
    })
    expect(task.projectId).toBe(project.id)
    expect(task.title).toBe('Draft experiment plan')
    expect(loadWorkspace(storage)).toEqual(store.getState())
  })
})


describe('workspace mutation commands', () => {
  it('updates task title, status, and priority', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T03:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renameTask(task.id, '  Review experiment plan  ')
    commands.changeTaskStatus(task.id, 'doing')
    commands.changeTaskPriority(task.id, 'high')

    expect(store.getState().tasks[0]).toMatchObject({
      title: 'Review experiment plan',
      status: 'doing',
      priority: 'high',
    })
  })

  it('deletes tasks and projects through the store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T03:35:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const firstTask = commands.addTask(project.id, 'First task')
    commands.addTask(project.id, 'Second task')

    commands.deleteTask(firstTask.id)

    expect(store.getState().tasks.map((task) => task.title)).toEqual([
      'Second task',
    ])

    commands.deleteProject(project.id)

    expect(store.getState()).toEqual({ projects: [], tasks: [] })
  })
})


describe('project rename command', () => {
  it('renames a project through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'project-1',
      now: () => '2026-09-03T04:35:00.000Z',
    })
    const project = commands.addProject('Robotics Research')

    commands.renameProject(project.id, '  Autonomy Lab  ')

    expect(store.getState().projects[0]?.name).toBe('Autonomy Lab')
  })
})


describe('task due date command', () => {
  it('sets and clears a task due date through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T05:05:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.changeTaskDueDate(task.id, '2026-09-12')
    expect(store.getState().tasks[0]?.dueDate).toBe('2026-09-12')

    commands.changeTaskDueDate(task.id, null)
    expect(store.getState().tasks[0]).not.toHaveProperty('dueDate')
  })
})


describe('task description command', () => {
  it('sets and clears a task description through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T05:25:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.changeTaskDescription(
      task.id,
      'Prepare the camera calibration procedure.',
    )
    expect(store.getState().tasks[0]?.description).toBe(
      'Prepare the camera calibration procedure.',
    )

    commands.changeTaskDescription(task.id, null)
    expect(store.getState().tasks[0]).not.toHaveProperty('description')
  })
})


describe('task project command', () => {
  it('moves a task between projects through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'project-2', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T16:30:00.000Z',
    })
    const robotics = commands.addProject('Robotics Research')
    const field = commands.addProject('Field Tests')
    const task = commands.addTask(robotics.id, 'Draft experiment plan')

    commands.changeTaskProject(task.id, field.id)

    expect(store.getState().tasks[0]?.projectId).toBe(field.id)
    expect(loadWorkspace(storage).tasks[0]?.projectId).toBe(field.id)
  })
})


describe('project description command', () => {
  it('sets and clears a project description through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'project-1',
      now: () => '2026-09-03T17:00:00.000Z',
    })
    const project = commands.addProject('Robotics Research')

    commands.changeProjectDescription(
      project.id,
      'Camera-guided robotics experiments.',
    )
    expect(store.getState().projects[0]?.description).toBe(
      'Camera-guided robotics experiments.',
    )

    commands.changeProjectDescription(project.id, null)
    expect(store.getState().projects[0]).not.toHaveProperty('description')
  })
})


describe('area commands', () => {
  it('creates, renames, assigns, and deletes areas through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['area-1', 'project-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T19:20:00.000Z',
    })

    const area = commands.addArea('Engineering')
    const project = commands.addProject('Robotics Research')

    commands.renameArea(area.id, 'Robotics')
    commands.changeProjectArea(project.id, area.id)

    expect(store.getState().areas?.[0]?.name).toBe('Robotics')
    expect(store.getState().projects[0]?.areaId).toBe(area.id)

    commands.deleteArea(area.id)

    expect(store.getState().areas).toEqual([])
    expect(store.getState().projects[0]).not.toHaveProperty('areaId')
    expect(loadWorkspace(storage).projects[0]).not.toHaveProperty('areaId')
  })
})


describe('list commands', () => {
  it('creates, renames, assigns, and deletes lists through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'list-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T03:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const list = commands.addTaskList(project.id, 'Backlog')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renameTaskList(list.id, 'Sprint 1')
    commands.changeTaskList(task.id, list.id)

    expect(store.getState().lists?.[0]?.name).toBe('Sprint 1')
    expect(store.getState().tasks[0]?.listId).toBe(list.id)

    commands.deleteTaskList(list.id)

    expect(store.getState().lists).toEqual([])
    expect(store.getState().tasks[0]).not.toHaveProperty('listId')
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('listId')
  })
})


it('creates a task directly in a list from the command boundary', () => {
  const storage = new MemoryStore()
  const store = createWorkspaceStore(storage)
  const ids = ['project-1', 'list-1', 'task-1']
  const commands = createWorkspaceCommands(store, {
    nextId: () => ids.shift() ?? 'unexpected-id',
    now: () => '2026-09-04T04:20:00.000Z',
  })
  const project = commands.addProject('Robotics Research')
  const list = commands.addTaskList(project.id, 'Backlog')

  const task = commands.addTask(
    project.id,
    'Draft experiment plan',
    list.id,
  )

  expect(task.listId).toBe(list.id)
  expect(loadWorkspace(storage).tasks[0]?.listId).toBe(list.id)
})


describe('subtask command', () => {
  it('creates a persisted subtask from an existing parent task', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'list-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T04:50:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const list = commands.addTaskList(project.id, 'Backlog')
    const parent = commands.addTask(
      project.id,
      'Draft experiment plan',
      list.id,
    )

    const child = commands.addSubtask(parent.id, 'Calibrate camera')

    expect(child.parentTaskId).toBe(parent.id)
    expect(child.projectId).toBe(parent.projectId)
    expect(child.listId).toBe(list.id)
    expect(loadWorkspace(storage).tasks[1]?.parentTaskId).toBe(parent.id)
  })
})


describe('checklist commands', () => {
  it('creates, renames, completes, and deletes a persisted checklist item', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'check-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T05:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    const item = commands.addChecklistItem(
      task.id,
      'Review safety notes',
    )
    commands.renameChecklistItem(
      task.id,
      item.id,
      'Confirm camera mount',
    )
    commands.changeChecklistItemCompleted(task.id, item.id, true)

    expect(store.getState().tasks[0]?.checklist?.[0]).toMatchObject({
      id: item.id,
      text: 'Confirm camera mount',
      completed: true,
    })
    expect(loadWorkspace(storage).tasks[0]?.checklist?.[0]).toMatchObject({
      id: item.id,
      completed: true,
    })

    commands.deleteChecklistItem(task.id, item.id)

    expect(store.getState().tasks[0]).not.toHaveProperty('checklist')
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('checklist')
  })
})


describe('manual order commands', () => {
  it('moves areas projects lists tasks and checklist items through the store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'area-1',
      'area-2',
      'project-1',
      'project-2',
      'project-3',
      'list-1',
      'list-2',
      'task-1',
      'task-2',
      'check-1',
      'check-2',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T06:40:00.000Z',
    })

    const engineering = commands.addArea('Engineering')
    const operations = commands.addArea('Operations')
    const firstProject = commands.addProject('Robotics Research')
    commands.addProject('Unassigned')
    const secondProject = commands.addProject('Controls')
    commands.changeProjectArea(firstProject.id, engineering.id)
    commands.changeProjectArea(secondProject.id, engineering.id)

    const firstList = commands.addTaskList(firstProject.id, 'Backlog')
    const secondList = commands.addTaskList(firstProject.id, 'Sprint 1')
    const firstTask = commands.addTask(
      firstProject.id,
      'Draft experiment plan',
      firstList.id,
    )
    const secondTask = commands.addTask(
      firstProject.id,
      'Calibrate camera',
      firstList.id,
    )
    const firstItem = commands.addChecklistItem(
      firstTask.id,
      'Review safety notes',
    )
    const secondItem = commands.addChecklistItem(
      firstTask.id,
      'Confirm camera mount',
    )

    commands.moveArea(operations.id, 'up')
    commands.moveProject(secondProject.id, 'up')
    commands.moveTaskList(secondList.id, 'up')
    commands.moveTask(secondTask.id, 'up')
    commands.moveChecklistItem(firstTask.id, secondItem.id, 'up')

    expect(store.getState().areas?.map((area) => area.id)).toEqual([
      operations.id,
      engineering.id,
    ])
    expect(store.getState().projects[0]?.id).toBe(secondProject.id)
    expect(store.getState().lists?.[0]?.id).toBe(secondList.id)
    expect(store.getState().tasks[0]?.id).toBe(secondTask.id)
    expect(
      store.getState().tasks.find((task) => task.id === firstTask.id)
        ?.checklist?.map((item) => item.id),
    ).toEqual([secondItem.id, firstItem.id])
  })
})


describe('tag commands', () => {
  it('creates renames assigns removes and deletes a persisted tag', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['tag-1', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T07:40:00.000Z',
    })

    const tag = commands.addTag('Safety')
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renameTag(tag.id, 'Camera')
    commands.assignTaskTag(task.id, tag.id)

    expect(store.getState().tags?.[0]?.name).toBe('Camera')
    expect(store.getState().tasks[0]?.tagIds).toEqual([tag.id])
    expect(loadWorkspace(storage).tasks[0]?.tagIds).toEqual([tag.id])

    commands.removeTaskTag(task.id, tag.id)
    expect(store.getState().tasks[0]).not.toHaveProperty('tagIds')

    commands.assignTaskTag(task.id, tag.id)
    commands.deleteTag(tag.id)

    expect(store.getState()).not.toHaveProperty('tags')
    expect(store.getState().tasks[0]).not.toHaveProperty('tagIds')
  })
})


describe('person and assignee commands', () => {
  it('creates renames assigns removes and deletes a persisted person', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['person-1', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T08:40:00.000Z',
    })

    const person = commands.addPerson('Ada Lovelace')
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renamePerson(person.id, 'Grace Hopper')
    commands.assignTaskAssignee(task.id, person.id)

    expect(store.getState().people?.[0]?.name).toBe('Grace Hopper')
    expect(store.getState().tasks[0]?.assigneeIds).toEqual([person.id])
    expect(loadWorkspace(storage).tasks[0]?.assigneeIds).toEqual([
      person.id,
    ])

    commands.removeTaskAssignee(task.id, person.id)
    expect(store.getState().tasks[0]).not.toHaveProperty('assigneeIds')

    commands.assignTaskAssignee(task.id, person.id)
    commands.deletePerson(person.id)

    expect(store.getState()).not.toHaveProperty('people')
    expect(store.getState().tasks[0]).not.toHaveProperty('assigneeIds')
  })
})


describe('custom field commands', () => {
  it('creates renames sets clears and deletes persisted custom fields', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['field-1', 'project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T09:40:00.000Z',
    })

    const field = commands.addCustomField('Notes', 'text')
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renameCustomField(field.id, 'Findings')
    commands.changeTaskCustomFieldValue(
      task.id,
      field.id,
      'Inspect mount',
    )

    expect(store.getState().customFields?.[0]?.name).toBe('Findings')
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      [field.id]: 'Inspect mount',
    })
    expect(
      loadWorkspace(storage).tasks[0]?.customFieldValues,
    ).toEqual({
      [field.id]: 'Inspect mount',
    })

    commands.changeTaskCustomFieldValue(task.id, field.id, null)
    expect(store.getState().tasks[0]).not.toHaveProperty(
      'customFieldValues',
    )

    commands.changeTaskCustomFieldValue(
      task.id,
      field.id,
      'Inspect mount',
    )
    commands.deleteCustomField(field.id)

    expect(store.getState()).not.toHaveProperty('customFields')
    expect(store.getState().tasks[0]).not.toHaveProperty(
      'customFieldValues',
    )
  })
})

describe('task relationship commands', () => {
  it('creates and deletes a persisted Blocks relationship', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2', 'relationship-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-04T11:00:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const first = commands.addTask(project.id, 'Draft experiment plan')
    const second = commands.addTask(project.id, 'Calibrate camera')

    const relationship = commands.addTaskRelationship(
      'blocks',
      first.id,
      second.id,
    )

    expect(store.getState().relationships).toEqual([relationship])
    expect(loadWorkspace(storage).relationships).toEqual([relationship])

    commands.deleteTaskRelationship(relationship.id)

    expect(store.getState()).not.toHaveProperty('relationships')
    expect(loadWorkspace(storage)).not.toHaveProperty('relationships')
  })
})
