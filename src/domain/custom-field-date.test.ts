import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'

type DateField = {
  id: string
  name: string
  type: 'date'
  createdAt: string
}

function normalizeDateValue() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      normalizeDateCustomFieldValue?: (value: unknown) => string
    }
  ).normalizeDateCustomFieldValue
}

describe('Date custom field domain', () => {
  it('creates Date fields without Select option metadata', () => {
    const field = (
      customFieldDomain.createCustomField as unknown as (input: {
        id: string
        name: string
        type: 'date'
        now: string
      }) => DateField
    )({
      id: 'field-date',
      name: '  Review date  ',
      type: 'date',
      now: '2026-09-13T13:00:00.000Z',
    })

    expect(field).toEqual({
      id: 'field-date',
      name: 'Review date',
      type: 'date',
      createdAt: '2026-09-13T13:00:00.000Z',
    })
    expect(field).not.toHaveProperty('options')
  })

  it('trims and normalizes exact calendar dates', () => {
    const normalize = normalizeDateValue()
    expect(normalize).toBeTypeOf('function')

    expect(normalize!(' 2028-02-29 ')).toBe('2028-02-29')
    expect(normalize!('2026-09-13')).toBe('2026-09-13')
  })

  it('rejects malformed and impossible calendar dates', () => {
    const normalize = normalizeDateValue()
    expect(normalize).toBeTypeOf('function')

    for (const value of [
      '2026-2-03',
      '2026-02-30',
      '2025-02-29',
      '2026-13-01',
      'not-a-date',
      20260913,
    ]) {
      expect(() => normalize!(value)).toThrow(
        'Date custom field value must use YYYY-MM-DD',
      )
    }
  })
})
