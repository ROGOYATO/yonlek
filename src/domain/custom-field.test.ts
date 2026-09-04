import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'

function createCustomField() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      createCustomField?: (input: {
        id: string
        name: string
        type: 'text' | 'number' | 'checkbox'
        now: string
      }) => {
        id: string
        name: string
        type: 'text' | 'number' | 'checkbox'
        createdAt: string
      }
    }
  ).createCustomField
}

function renameCustomField() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      renameCustomField?: (
        field: {
          id: string
          name: string
          type: 'text' | 'number' | 'checkbox'
          createdAt: string
        },
        name: string,
      ) => {
        id: string
        name: string
        type: 'text' | 'number' | 'checkbox'
        createdAt: string
      }
    }
  ).renameCustomField
}

function normalizeCustomFieldValue() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      normalizeCustomFieldValue?: (
        type: 'text' | 'number' | 'checkbox',
        value: unknown,
      ) => string | number | boolean
    }
  ).normalizeCustomFieldValue
}

describe('custom field domain', () => {
  it.each(['text', 'number', 'checkbox'] as const)(
    'creates a trimmed %s custom field definition',
    (type) => {
      expect(
        createCustomField()?.({
          id: `field-${type}`,
          name: '  Experiment value  ',
          type,
          now: '2026-09-04T09:10:00.000Z',
        }),
      ).toEqual({
        id: `field-${type}`,
        name: 'Experiment value',
        type,
        createdAt: '2026-09-04T09:10:00.000Z',
      })
    },
  )

  it('rejects a blank custom field name', () => {
    expect(() =>
      createCustomField()?.({
        id: 'field-1',
        name: '   ',
        type: 'text',
        now: '2026-09-04T09:10:00.000Z',
      }),
    ).toThrow('Custom field name is required')
  })

  it('renames a definition without changing its type', () => {
    const field = {
      id: 'field-1',
      name: 'Notes',
      type: 'text' as const,
      createdAt: '2026-09-04T09:10:00.000Z',
    }

    const next = renameCustomField()?.(field, '  Findings  ')

    expect(next?.name).toBe('Findings')
    expect(next?.type).toBe('text')
    expect(field.name).toBe('Notes')
  })

  it('validates values against the field type', () => {
    expect(normalizeCustomFieldValue()?.('text', '  hello  ')).toBe(
      'hello',
    )
    expect(normalizeCustomFieldValue()?.('number', 3.5)).toBe(3.5)
    expect(normalizeCustomFieldValue()?.('checkbox', true)).toBe(true)

    expect(() =>
      normalizeCustomFieldValue()?.('number', '3.5'),
    ).toThrow('Custom field value does not match field type')
  })
})
