import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'

type FormulaOperator = '+' | '-' | '*' | '/'

type FormulaConfig = {
  leftFieldId: string
  operator: FormulaOperator
  rightFieldId: string
}

type FormulaField = {
  id: string
  name: string
  type: 'formula'
  createdAt: string
  formula?: FormulaConfig
}

type AnyField = FormulaField | {
  id: string
  name: string
  type: 'text' | 'number' | 'checkbox' | 'select' | 'date'
  createdAt: string
}

function formulaHelpers() {
  const domain = customFieldDomain as typeof customFieldDomain & {
    configureCustomFieldFormula?: (
      field: AnyField,
      formula: FormulaConfig,
    ) => FormulaField
    clearCustomFieldFormula?: (field: AnyField) => FormulaField
  }

  return {
    configure: domain.configureCustomFieldFormula,
    clear: domain.clearCustomFieldFormula,
  }
}

describe('Formula custom field definitions', () => {
  it('creates Formula fields unconfigured and without Select option metadata', () => {
    const field = (
      customFieldDomain.createCustomField as unknown as (input: {
        id: string
        name: string
        type: 'formula'
        now: string
      }) => FormulaField
    )({
      id: 'field-total',
      name: '  Total score  ',
      type: 'formula',
      now: '2026-09-13T09:00:00.000Z',
    })

    expect(field).toEqual({
      id: 'field-total',
      name: 'Total score',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
    })
    expect(field).not.toHaveProperty('options')
    expect(field).not.toHaveProperty('formula')
  })

  it('configures and clears a binary Formula without mutating the source field', () => {
    const { configure, clear } = formulaHelpers()
    expect(configure).toBeTypeOf('function')
    expect(clear).toBeTypeOf('function')

    const field: FormulaField = {
      id: 'field-total',
      name: 'Total score',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
    }

    const configured = configure!(field, {
      leftFieldId: ' field-left ',
      operator: '+',
      rightFieldId: ' field-right ',
    })
    const cleared = clear!(configured)

    expect(configured.formula).toEqual({
      leftFieldId: 'field-left',
      operator: '+',
      rightFieldId: 'field-right',
    })
    expect(field).not.toHaveProperty('formula')
    expect(cleared).not.toHaveProperty('formula')
    expect(configured.name).toBe('Total score')
  })

  it('rejects invalid Formula structure and non-Formula definitions', () => {
    const { configure, clear } = formulaHelpers()
    expect(configure).toBeTypeOf('function')
    expect(clear).toBeTypeOf('function')

    const formula: FormulaField = {
      id: 'field-total',
      name: 'Total score',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
    }
    const numberField: AnyField = {
      id: 'field-number',
      name: 'Score',
      type: 'number',
      createdAt: '2026-09-13T09:00:00.000Z',
    }

    expect(() =>
      configure!(formula, {
        leftFieldId: '   ',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Formula operand field is required')
    expect(() =>
      configure!(formula, {
        leftFieldId: 'field-left',
        operator: '%' as FormulaOperator,
        rightFieldId: 'field-right',
      }),
    ).toThrow('Formula operator is invalid')
    expect(() =>
      configure!(numberField, {
        leftFieldId: 'field-left',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Custom field must be Formula')
    expect(() => clear!(numberField)).toThrow('Custom field must be Formula')
  })
})
