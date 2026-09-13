import { describe, expect, it } from 'vitest'

import * as customFieldDomain from './custom-field'

type SelectOption = {
  id: string
  name: string
}

type SelectField = {
  id: string
  name: string
  type: 'select'
  createdAt: string
  options: SelectOption[]
}

type AnyField = SelectField | {
  id: string
  name: string
  type: 'text' | 'number' | 'checkbox'
  createdAt: string
}

function selectHelpers() {
  const domain = customFieldDomain as typeof customFieldDomain & {
    addCustomFieldOption?: (
      field: AnyField,
      option: SelectOption,
    ) => SelectField
    renameCustomFieldOption?: (
      field: AnyField,
      optionId: string,
      name: string,
    ) => SelectField
    deleteCustomFieldOption?: (
      field: AnyField,
      optionId: string,
    ) => SelectField
  }

  return {
    add: domain.addCustomFieldOption,
    rename: domain.renameCustomFieldOption,
    remove: domain.deleteCustomFieldOption,
  }
}

describe('Select custom field options', () => {
  it('creates Select fields with an ordered empty option collection', () => {
    const field = (
      customFieldDomain.createCustomField as unknown as (input: {
        id: string
        name: string
        type: 'select'
        now: string
      }) => SelectField
    )({
      id: 'field-1',
      name: '  Experiment phase  ',
      type: 'select',
      now: '2026-09-13T08:00:00.000Z',
    })

    expect(field).toEqual({
      id: 'field-1',
      name: 'Experiment phase',
      type: 'select',
      createdAt: '2026-09-13T08:00:00.000Z',
      options: [],
    })
  })

  it('adds, renames, and deletes options without mutating the source field', () => {
    const { add, rename, remove } = selectHelpers()
    expect(add).toBeTypeOf('function')
    expect(rename).toBeTypeOf('function')
    expect(remove).toBeTypeOf('function')

    const field: SelectField = {
      id: 'field-1',
      name: 'Experiment phase',
      type: 'select',
      createdAt: '2026-09-13T08:00:00.000Z',
      options: [],
    }

    const withDraft = add!(field, {
      id: 'option-draft',
      name: '  Draft  ',
    })
    const renamed = rename!(withDraft, 'option-draft', '  Review  ')
    const removed = remove!(renamed, 'option-draft')

    expect(withDraft.options).toEqual([
      { id: 'option-draft', name: 'Draft' },
    ])
    expect(renamed.options).toEqual([
      { id: 'option-draft', name: 'Review' },
    ])
    expect(removed.options).toEqual([])
    expect(field.options).toEqual([])
    expect(withDraft.options[0]?.name).toBe('Draft')
  })

  it('rejects blank names, duplicate ids, non-Select fields, and missing options', () => {
    const { add, rename, remove } = selectHelpers()
    expect(add).toBeTypeOf('function')
    expect(rename).toBeTypeOf('function')
    expect(remove).toBeTypeOf('function')

    const field: SelectField = {
      id: 'field-1',
      name: 'Experiment phase',
      type: 'select',
      createdAt: '2026-09-13T08:00:00.000Z',
      options: [{ id: 'option-1', name: 'Draft' }],
    }
    const textField: AnyField = {
      id: 'field-text',
      name: 'Notes',
      type: 'text',
      createdAt: '2026-09-13T08:00:00.000Z',
    }

    expect(() => add!(field, { id: 'option-2', name: '   ' })).toThrow(
      'Custom field option name is required',
    )
    expect(() =>
      add!(field, { id: 'option-1', name: 'Duplicate' }),
    ).toThrow('Custom field option id already exists')
    expect(() =>
      add!(textField, { id: 'option-2', name: 'Draft' }),
    ).toThrow('Custom field must be Select')
    expect(() => rename!(field, 'missing', 'Review')).toThrow(
      'Custom field option not found',
    )
    expect(() => remove!(field, 'missing')).toThrow(
      'Custom field option not found',
    )
  })
})
