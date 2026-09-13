import { describe, expect, it } from 'vitest'

import {
  addCustomFieldOption,
  createCustomField,
  type CustomFieldDefinition,
} from './custom-field'
import { createTask } from './task'
import * as taskFilterDomain from './task-filter'

type CustomFieldTaskFilter = {
  fieldId: string
  fieldType: 'text' | 'number' | 'checkbox' | 'select' | 'date'
  value: string | number | boolean
}

type CreateCustomFieldTaskFilter = (
  field: CustomFieldDefinition,
  value: unknown,
) => CustomFieldTaskFilter

function getCreateCustomFieldTaskFilter():
  | CreateCustomFieldTaskFilter
  | undefined {
  return (
    taskFilterDomain as typeof taskFilterDomain & {
      createCustomFieldTaskFilter?: CreateCustomFieldTaskFilter
    }
  ).createCustomFieldTaskFilter
}

const baseFilter = {
  query: '',
  status: 'all' as const,
  priority: 'all' as const,
  dueDate: 'all' as const,
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
    now: '2026-09-13T08:00:00.000Z',
  })
}

describe('Custom Field Task filtering', () => {
  it('creates normalized typed filters and rejects invalid values', () => {
    const createFilter = getCreateCustomFieldTaskFilter()
    expect(createFilter).toBeTypeOf('function')

    const text = field('field-text', 'Notes', 'text')
    const number = field('field-number', 'Score', 'number')
    const checkbox = field('field-checkbox', 'Approved', 'checkbox')
    const date = field('field-date', 'Review date', 'date')
    const select = addCustomFieldOption(
      field('field-select', 'Phase', 'select'),
      { id: 'option-review', name: 'Review' },
    )

    expect(createFilter?.(text, '  CAMERA  ')).toEqual({
      fieldId: text.id,
      fieldType: 'text',
      value: 'CAMERA',
    })
    expect(createFilter?.(number, 4)).toEqual({
      fieldId: number.id,
      fieldType: 'number',
      value: 4,
    })
    expect(createFilter?.(checkbox, false)).toEqual({
      fieldId: checkbox.id,
      fieldType: 'checkbox',
      value: false,
    })
    expect(createFilter?.(select, 'option-review')).toEqual({
      fieldId: select.id,
      fieldType: 'select',
      value: 'option-review',
    })
    expect(createFilter?.(date, ' 2026-09-21 ')).toEqual({
      fieldId: date.id,
      fieldType: 'date',
      value: '2026-09-21',
    })

    expect(() => createFilter?.(text, '   ')).toThrow(
      'Custom field filter value is required',
    )
    expect(() => createFilter?.(number, Number.NaN)).toThrow(
      'Custom field value does not match field type',
    )
    expect(() => createFilter?.(select, 'missing-option')).toThrow(
      'Custom field option not found',
    )
    expect(() => createFilter?.(date, '2026-02-30')).toThrow(
      'Date custom field value must use YYYY-MM-DD',
    )
  })

  it('filters Text, Number, Checkbox, Select, and Date values with built-in filters', () => {
    const createFilter = getCreateCustomFieldTaskFilter()
    expect(createFilter).toBeTypeOf('function')

    const text = field('field-text', 'Notes', 'text')
    const number = field('field-number', 'Score', 'number')
    const checkbox = field('field-checkbox', 'Approved', 'checkbox')
    const date = field('field-date', 'Review date', 'date')
    const select = addCustomFieldOption(
      addCustomFieldOption(field('field-select', 'Phase', 'select'), {
        id: 'option-draft',
        name: 'Draft',
      }),
      { id: 'option-review', name: 'Review' },
    )
    const fields = [text, number, checkbox, select, date]

    const alpha = {
      ...createTask({
        id: 'task-alpha',
        projectId: 'project-1',
        title: 'Alpha',
        now: '2026-09-13T08:01:00.000Z',
      }),
      status: 'doing' as const,
      customFieldValues: {
        [text.id]: 'Camera calibration',
        [number.id]: 4,
        [checkbox.id]: true,
        [select.id]: 'option-review',
        [date.id]: '2026-09-21',
      },
    }
    const beta = {
      ...createTask({
        id: 'task-beta',
        projectId: 'project-1',
        title: 'Beta',
        now: '2026-09-13T08:02:00.000Z',
      }),
      customFieldValues: {
        [text.id]: 'Lidar review',
        [number.id]: 2,
        [checkbox.id]: false,
        [select.id]: 'option-draft',
        [date.id]: '2026-09-22',
      },
    }
    const missing = createTask({
      id: 'task-missing',
      projectId: 'project-1',
      title: 'Missing values',
      now: '2026-09-13T08:03:00.000Z',
    })
    const tasks = [alpha, beta, missing]

    const cases: Array<[CustomFieldDefinition, unknown, string[]]> = [
      [text, 'CAMERA', ['task-alpha']],
      [number, 2, ['task-beta']],
      [checkbox, false, ['task-beta']],
      [select, 'option-review', ['task-alpha']],
      [date, '2026-09-22', ['task-beta']],
    ]

    for (const [definition, value, expectedIds] of cases) {
      const customField = createFilter?.(definition, value)
      expect(
        taskFilterDomain
          .filterTasks(
            tasks,
            { ...baseFilter, customField },
            fields,
          )
          .map((task) => task.id),
      ).toEqual(expectedIds)
    }

    const combined = createFilter?.(text, 'camera')
    expect(
      taskFilterDomain
        .filterTasks(
          tasks,
          { ...baseFilter, status: 'doing', customField: combined },
          fields,
        )
        .map((task) => task.id),
    ).toEqual(['task-alpha'])
  })

  it('treats missing definitions and stale Select options as inactive filters', () => {
    const select = addCustomFieldOption(
      field('field-select', 'Phase', 'select'),
      { id: 'option-review', name: 'Review' },
    )
    const alpha = {
      ...createTask({
        id: 'task-alpha',
        projectId: 'project-1',
        title: 'Alpha',
        now: '2026-09-13T08:01:00.000Z',
      }),
      customFieldValues: { [select.id]: 'option-review' },
    }
    const beta = createTask({
      id: 'task-beta',
      projectId: 'project-1',
      title: 'Beta',
      now: '2026-09-13T08:02:00.000Z',
    })
    const tasks = [alpha, beta]

    expect(
      taskFilterDomain
        .filterTasks(
          tasks,
          {
            ...baseFilter,
            customField: {
              fieldId: 'deleted-field',
              fieldType: 'text',
              value: 'alpha',
            },
          },
          [select],
        )
        .map((task) => task.id),
    ).toEqual(['task-alpha', 'task-beta'])

    expect(
      taskFilterDomain
        .filterTasks(
          tasks,
          {
            ...baseFilter,
            customField: {
              fieldId: select.id,
              fieldType: 'select',
              value: 'deleted-option',
            },
          },
          [select],
        )
        .map((task) => task.id),
    ).toEqual(['task-alpha', 'task-beta'])
  })
})
