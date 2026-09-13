import { describe, expect, it } from 'vitest'

import {
  addCustomFieldOption,
  createCustomField,
  type CustomFieldDefinition,
} from './custom-field'
import { createTask } from './task'
import * as taskSortDomain from './task-sort'

type CustomFieldTaskSort = { fieldId: string }
type CreateCustomFieldTaskSort = (fieldId: string) => CustomFieldTaskSort

function getCreateCustomFieldTaskSort():
  | CreateCustomFieldTaskSort
  | undefined {
  return (
    taskSortDomain as typeof taskSortDomain & {
      createCustomFieldTaskSort?: CreateCustomFieldTaskSort
    }
  ).createCustomFieldTaskSort
}

function field(
  id: string,
  name: string,
  type: CustomFieldDefinition['type'],
): CustomFieldDefinition {
  return createCustomField({
    id,
    name,
    type,
    now: '2026-09-13T08:10:00.000Z',
  })
}

describe('Custom Field Task sorting', () => {
  it('creates normalized sort specs and rejects blank field ids', () => {
    const createSort = getCreateCustomFieldTaskSort()
    expect(createSort).toBeTypeOf('function')

    expect(createSort?.(' field-score ')).toEqual({ fieldId: 'field-score' })
    expect(() => createSort?.('   ')).toThrow(
      'Custom field sort field is required',
    )
  })

  it('sorts every Custom Field type with missing values last', () => {
    const createSort = getCreateCustomFieldTaskSort()
    expect(createSort).toBeTypeOf('function')

    const text = field('field-text', 'Text', 'text')
    const number = field('field-number', 'Number', 'number')
    const checkbox = field('field-checkbox', 'Checkbox', 'checkbox')
    const date = field('field-date', 'Date', 'date')
    const select = addCustomFieldOption(
      addCustomFieldOption(field('field-select', 'Phase', 'select'), {
        id: 'option-review',
        name: 'Review',
      }),
      { id: 'option-ready', name: 'Ready' },
    )
    const fields = [text, number, checkbox, select, date]

    const first = {
      ...createTask({
        id: 'task-first',
        projectId: 'project-1',
        title: 'First',
        now: '2026-09-13T08:11:00.000Z',
      }),
      customFieldValues: {
        [text.id]: 'beta',
        [number.id]: 10,
        [checkbox.id]: true,
        [select.id]: 'option-ready',
        [date.id]: '2026-09-22',
      },
    }
    const second = {
      ...createTask({
        id: 'task-second',
        projectId: 'project-1',
        title: 'Second',
        now: '2026-09-13T08:12:00.000Z',
      }),
      customFieldValues: {
        [text.id]: 'Alpha',
        [number.id]: 2,
        [checkbox.id]: false,
        [select.id]: 'option-review',
        [date.id]: '2026-09-21',
      },
    }
    const missing = createTask({
      id: 'task-missing',
      projectId: 'project-1',
      title: 'Missing',
      now: '2026-09-13T08:13:00.000Z',
    })
    const tasks = [first, missing, second]

    for (const definition of fields) {
      expect(
        taskSortDomain
          .sortTasks(
            tasks,
            'created',
            fields,
            createSort?.(definition.id),
          )
          .map((task) => task.id),
      ).toEqual(['task-second', 'task-first', 'task-missing'])
    }

    expect(tasks.map((task) => task.id)).toEqual([
      'task-first',
      'task-missing',
      'task-second',
    ])
  })

  it('uses createdAt for equal or missing values and ignores deleted fields', () => {
    const createSort = getCreateCustomFieldTaskSort()
    expect(createSort).toBeTypeOf('function')

    const score = field('field-score', 'Score', 'number')
    const later = {
      ...createTask({
        id: 'task-later',
        projectId: 'project-1',
        title: 'Later',
        now: '2026-09-13T08:12:00.000Z',
      }),
      customFieldValues: { [score.id]: 3 },
    }
    const earlier = {
      ...createTask({
        id: 'task-earlier',
        projectId: 'project-1',
        title: 'Earlier',
        now: '2026-09-13T08:11:00.000Z',
      }),
      customFieldValues: { [score.id]: 3 },
    }
    const missingLater = createTask({
      id: 'task-missing-later',
      projectId: 'project-1',
      title: 'Missing later',
      now: '2026-09-13T08:14:00.000Z',
    })
    const missingEarlier = createTask({
      id: 'task-missing-earlier',
      projectId: 'project-1',
      title: 'Missing earlier',
      now: '2026-09-13T08:13:00.000Z',
    })
    const tasks = [later, missingLater, earlier, missingEarlier]

    expect(
      taskSortDomain
        .sortTasks(tasks, 'created', [score], createSort?.(score.id))
        .map((task) => task.id),
    ).toEqual([
      'task-earlier',
      'task-later',
      'task-missing-earlier',
      'task-missing-later',
    ])

    expect(
      taskSortDomain
        .sortTasks(tasks, 'created', [score], createSort?.('deleted-field'))
        .map((task) => task.id),
    ).toEqual(tasks.map((task) => task.id))
  })
})
