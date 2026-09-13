import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'
import type {
  CustomFieldDefinition,
  CustomFieldType,
} from './custom-field'

function migrationHelper() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      migrateCustomFieldType?: (
        field: CustomFieldDefinition,
        nextType: CustomFieldType,
      ) => CustomFieldDefinition
    }
  ).migrateCustomFieldType
}

function field(
  type: CustomFieldType,
  extra: Partial<CustomFieldDefinition> = {},
): CustomFieldDefinition {
  return {
    id: 'field-1',
    name: 'Score',
    type,
    createdAt: '2026-09-13T10:00:00.000Z',
    ...extra,
  }
}

describe('Custom Field type migration', () => {
  it('preserves identity while replacing type-specific metadata', () => {
    const migrate = migrationHelper()
    expect(migrate).toBeTypeOf('function')

    const select = field('select', {
      options: [
        { id: 'option-1', name: 'One' },
        { id: 'option-2', name: 'Two' },
      ],
    })
    const formula = field('formula', {
      formula: {
        leftFieldId: 'field-left',
        operator: '+',
        rightFieldId: 'field-right',
      },
    })

    const toText = migrate!(select, 'text')
    const toSelect = migrate!(formula, 'select')
    const toFormula = migrate!(select, 'formula')

    expect(toText).toEqual({
      id: 'field-1',
      name: 'Score',
      type: 'text',
      createdAt: '2026-09-13T10:00:00.000Z',
    })
    expect(toText).not.toHaveProperty('options')
    expect(toText).not.toHaveProperty('formula')
    expect(toSelect).toEqual({
      id: 'field-1',
      name: 'Score',
      type: 'select',
      createdAt: '2026-09-13T10:00:00.000Z',
      options: [],
    })
    expect(toSelect).not.toHaveProperty('formula')
    expect(toFormula).toEqual({
      id: 'field-1',
      name: 'Score',
      type: 'formula',
      createdAt: '2026-09-13T10:00:00.000Z',
    })
    expect(toFormula).not.toHaveProperty('options')
    expect(toFormula).not.toHaveProperty('formula')
    expect(select.options).toHaveLength(2)
    expect(formula).toHaveProperty('formula')
  })

  it('treats a same-type migration as a no-op for every current type', () => {
    const migrate = migrationHelper()
    expect(migrate).toBeTypeOf('function')

    const samples: CustomFieldDefinition[] = [
      field('text'),
      field('number'),
      field('checkbox'),
      field('select', { options: [{ id: 'option-1', name: 'One' }] }),
      field('date'),
      field('formula', {
        formula: {
          leftFieldId: 'field-left',
          operator: '*',
          rightFieldId: 'field-right',
        },
      }),
    ]

    for (const sample of samples) {
      expect(migrate!(sample, sample.type)).toBe(sample)
    }
  })
})
