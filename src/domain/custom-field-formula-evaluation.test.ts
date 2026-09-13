import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'
import type { Task } from './task'

type FormulaField = {
  id: string
  name: string
  type: 'formula'
  createdAt: string
  formula?: {
    leftFieldId: string
    operator: '+' | '-' | '*' | '/'
    rightFieldId: string
  }
}

type NumberField = {
  id: string
  name: string
  type: 'number'
  createdAt: string
}

type Field = FormulaField | NumberField

function evaluator() {
  return (
    customFieldDomain as typeof customFieldDomain & {
      evaluateCustomFieldFormula?: (
        fieldId: string,
        task: Task,
        fields: Field[],
      ) => number | null
    }
  ).evaluateCustomFieldFormula
}

function task(values: Record<string, number> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Score task',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-13T09:00:00.000Z',
    customFieldValues: values,
  }
}

const numberLeft: NumberField = {
  id: 'field-left',
  name: 'Left',
  type: 'number',
  createdAt: '2026-09-13T09:00:00.000Z',
}

const numberRight: NumberField = {
  id: 'field-right',
  name: 'Right',
  type: 'number',
  createdAt: '2026-09-13T09:00:00.000Z',
}

describe('Formula custom field evaluation', () => {
  it('evaluates the four numeric binary operators', () => {
    const evaluate = evaluator()
    expect(evaluate).toBeTypeOf('function')

    const expected = new Map([
      ['+', 10],
      ['-', 4],
      ['*', 21],
      ['/', 7 / 3],
    ] as const)

    for (const [operator, result] of expected) {
      const formula: FormulaField = {
        id: `formula-${operator}`,
        name: `Formula ${operator}`,
        type: 'formula',
        createdAt: '2026-09-13T09:00:00.000Z',
        formula: {
          leftFieldId: numberLeft.id,
          operator,
          rightFieldId: numberRight.id,
        },
      }

      expect(
        evaluate!(formula.id, task({
          [numberLeft.id]: 7,
          [numberRight.id]: 3,
        }), [numberLeft, numberRight, formula]),
      ).toBe(result)
    }
  })

  it('evaluates chained Formula fields recursively', () => {
    const evaluate = evaluator()
    expect(evaluate).toBeTypeOf('function')

    const subtotal: FormulaField = {
      id: 'field-subtotal',
      name: 'Subtotal',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: numberLeft.id,
        operator: '+',
        rightFieldId: numberRight.id,
      },
    }
    const total: FormulaField = {
      id: 'field-total',
      name: 'Total',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: subtotal.id,
        operator: '*',
        rightFieldId: numberRight.id,
      },
    }

    expect(
      evaluate!(total.id, task({
        [numberLeft.id]: 4,
        [numberRight.id]: 2,
      }), [numberLeft, numberRight, subtotal, total]),
    ).toBe(12)
  })

  it('returns null for unavailable operands and unsafe arithmetic', () => {
    const evaluate = evaluator()
    expect(evaluate).toBeTypeOf('function')

    const unconfigured: FormulaField = {
      id: 'formula-unconfigured',
      name: 'Unconfigured',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
    }
    const divide: FormulaField = {
      id: 'formula-divide',
      name: 'Divide',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: numberLeft.id,
        operator: '/',
        rightFieldId: numberRight.id,
      },
    }
    const overflow: FormulaField = {
      id: 'formula-overflow',
      name: 'Overflow',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: numberLeft.id,
        operator: '*',
        rightFieldId: numberRight.id,
      },
    }
    const missingField: FormulaField = {
      id: 'formula-missing',
      name: 'Missing',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: 'missing-field',
        operator: '+',
        rightFieldId: numberRight.id,
      },
    }

    expect(evaluate!(unconfigured.id, task(), [unconfigured])).toBeNull()
    expect(
      evaluate!(divide.id, task({
        [numberLeft.id]: 4,
        [numberRight.id]: 0,
      }), [numberLeft, numberRight, divide]),
    ).toBeNull()
    expect(
      evaluate!(overflow.id, task({
        [numberLeft.id]: Number.MAX_VALUE,
        [numberRight.id]: 2,
      }), [numberLeft, numberRight, overflow]),
    ).toBeNull()
    expect(
      evaluate!(missingField.id, task({ [numberRight.id]: 2 }), [
        numberRight,
        missingField,
      ]),
    ).toBeNull()
    expect(
      evaluate!(divide.id, task({ [numberLeft.id]: 4 }), [
        numberLeft,
        numberRight,
        divide,
      ]),
    ).toBeNull()
  })

  it('returns null when malformed persisted Formula data contains a cycle', () => {
    const evaluate = evaluator()
    expect(evaluate).toBeTypeOf('function')

    const first: FormulaField = {
      id: 'formula-first',
      name: 'First',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: 'formula-second',
        operator: '+',
        rightFieldId: numberRight.id,
      },
    }
    const second: FormulaField = {
      id: 'formula-second',
      name: 'Second',
      type: 'formula',
      createdAt: '2026-09-13T09:00:00.000Z',
      formula: {
        leftFieldId: 'formula-first',
        operator: '+',
        rightFieldId: numberRight.id,
      },
    }

    expect(
      evaluate!(first.id, task({ [numberRight.id]: 1 }), [
        numberRight,
        first,
        second,
      ]),
    ).toBeNull()
  })
})
