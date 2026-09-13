export type CustomFieldType = 'text' | 'number' | 'checkbox' | 'select' | 'date' | 'formula'
export type CustomFieldFormulaOperator = '+' | '-' | '*' | '/'

export interface CustomFieldFormula {
  leftFieldId: string
  operator: CustomFieldFormulaOperator
  rightFieldId: string
}
export type CustomFieldValue = string | number | boolean

export interface CustomFieldOption {
  id: string
  name: string
}

export interface CustomFieldDefinition {
  id: string
  name: string
  type: CustomFieldType
  createdAt: string
  options?: CustomFieldOption[]
  formula?: CustomFieldFormula
}

export interface CreateCustomFieldInput {
  id: string
  name: string
  type: CustomFieldType
  now: string
}

export function createCustomField(
  input: CreateCustomFieldInput,
): CustomFieldDefinition {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Custom field name is required')
  }

  const field: CustomFieldDefinition = {
    id: input.id,
    name,
    type: input.type,
    createdAt: input.now,
  }

  if (input.type === 'select') {
    field.options = []
  }

  return field
}

export function renameCustomField(
  field: CustomFieldDefinition,
  nextName: string,
): CustomFieldDefinition {
  const name = nextName.trim()

  if (!name) {
    throw new Error('Custom field name is required')
  }

  return {
    ...field,
    name,
  }
}

export function migrateCustomFieldType(
  field: CustomFieldDefinition,
  nextType: CustomFieldType,
): CustomFieldDefinition {
  if (field.type === nextType) {
    return field
  }

  const migrated: CustomFieldDefinition = {
    id: field.id,
    name: field.name,
    type: nextType,
    createdAt: field.createdAt,
  }

  if (nextType === 'select') {
    migrated.options = []
  }

  return migrated
}


function requireFormulaField(
  field: CustomFieldDefinition,
): asserts field is CustomFieldDefinition & { type: 'formula' } {
  if (field.type !== 'formula') {
    throw new Error('Custom field must be Formula')
  }
}

function normalizeFormulaOperandFieldId(fieldId: string): string {
  const normalized = fieldId.trim()

  if (!normalized) {
    throw new Error('Formula operand field is required')
  }

  return normalized
}

function normalizeFormulaOperator(
  operator: CustomFieldFormulaOperator,
): CustomFieldFormulaOperator {
  if (
    operator !== '+' &&
    operator !== '-' &&
    operator !== '*' &&
    operator !== '/'
  ) {
    throw new Error('Formula operator is invalid')
  }

  return operator
}

export function configureCustomFieldFormula(
  field: CustomFieldDefinition,
  formula: CustomFieldFormula,
): CustomFieldDefinition {
  requireFormulaField(field)

  return {
    ...field,
    formula: {
      leftFieldId: normalizeFormulaOperandFieldId(formula.leftFieldId),
      operator: normalizeFormulaOperator(formula.operator),
      rightFieldId: normalizeFormulaOperandFieldId(formula.rightFieldId),
    },
  }
}

export function clearCustomFieldFormula(
  field: CustomFieldDefinition,
): CustomFieldDefinition {
  requireFormulaField(field)

  const next = { ...field }
  delete next.formula
  return next
}

function requireSelectField(
  field: CustomFieldDefinition,
): asserts field is CustomFieldDefinition & { options: CustomFieldOption[] } {
  if (field.type !== 'select') {
    throw new Error('Custom field must be Select')
  }

  if (!Array.isArray(field.options)) {
    throw new Error('Select custom field options are required')
  }
}

function normalizeOptionId(optionId: string): string {
  const id = optionId.trim()

  if (!id) {
    throw new Error('Custom field option id is required')
  }

  return id
}

function normalizeOptionName(name: string): string {
  const normalized = name.trim()

  if (!normalized) {
    throw new Error('Custom field option name is required')
  }

  return normalized
}

export function addCustomFieldOption(
  field: CustomFieldDefinition,
  option: CustomFieldOption,
): CustomFieldDefinition {
  requireSelectField(field)

  const id = normalizeOptionId(option.id)
  const name = normalizeOptionName(option.name)

  if (field.options.some((candidate) => candidate.id === id)) {
    throw new Error('Custom field option id already exists')
  }

  return {
    ...field,
    options: [...field.options, { id, name }],
  }
}

export function renameCustomFieldOption(
  field: CustomFieldDefinition,
  optionId: string,
  nextName: string,
): CustomFieldDefinition {
  requireSelectField(field)

  const id = normalizeOptionId(optionId)
  const name = normalizeOptionName(nextName)

  if (!field.options.some((candidate) => candidate.id === id)) {
    throw new Error('Custom field option not found')
  }

  return {
    ...field,
    options: field.options.map((candidate) =>
      candidate.id === id ? { ...candidate, name } : candidate,
    ),
  }
}

export function deleteCustomFieldOption(
  field: CustomFieldDefinition,
  optionId: string,
): CustomFieldDefinition {
  requireSelectField(field)

  const id = normalizeOptionId(optionId)

  if (!field.options.some((candidate) => candidate.id === id)) {
    throw new Error('Custom field option not found')
  }

  return {
    ...field,
    options: field.options.filter((candidate) => candidate.id !== id),
  }
}


export function normalizeDateCustomFieldValue(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Date custom field value must use YYYY-MM-DD')
  }

  const normalized = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized)

  if (!match) {
    throw new Error('Date custom field value must use YYYY-MM-DD')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Date custom field value must use YYYY-MM-DD')
  }

  return normalized
}



export function validateCustomFieldFormulaDependencies(
  fields: CustomFieldDefinition[],
): void {
  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const visitState = new Map<string, 'visiting' | 'visited'>()

  function visit(field: CustomFieldDefinition): void {
    if (field.type !== 'formula' || field.formula === undefined) {
      return
    }

    const state = visitState.get(field.id)

    if (state === 'visiting') {
      throw new Error('Formula dependency cycle is not allowed')
    }

    if (state === 'visited') {
      return
    }

    const normalized = configureCustomFieldFormula(field, field.formula)
      .formula!

    visitState.set(field.id, 'visiting')

    for (const operandId of [
      normalized.leftFieldId,
      normalized.rightFieldId,
    ]) {
      if (operandId === field.id) {
        throw new Error('Formula cannot reference itself')
      }

      const operand = fieldsById.get(operandId)

      if (!operand) {
        throw new Error('Formula operand field not found')
      }

      if (operand.type !== 'number' && operand.type !== 'formula') {
        throw new Error('Formula operand must be Number or Formula')
      }

      if (operand.type === 'formula') {
        visit(operand)
      }
    }

    visitState.set(field.id, 'visited')
  }

  for (const field of fields) {
    visit(field)
  }
}

export interface FormulaEvaluableTask {
  customFieldValues?: Record<string, CustomFieldValue>
}

export function evaluateCustomFieldFormula(
  fieldId: string,
  task: FormulaEvaluableTask,
  fields: CustomFieldDefinition[],
): number | null {
  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const target = fieldsById.get(fieldId)

  if (target?.type !== 'formula') {
    return null
  }

  function evaluateField(
    currentFieldId: string,
    visiting: Set<string>,
  ): number | null {
    const field = fieldsById.get(currentFieldId)

    if (!field) {
      return null
    }

    if (field.type === 'number') {
      const value = task.customFieldValues?.[field.id]
      return typeof value === 'number' && Number.isFinite(value)
        ? value
        : null
    }

    if (field.type !== 'formula' || field.formula === undefined) {
      return null
    }

    if (visiting.has(field.id)) {
      return null
    }

    const nextVisiting = new Set(visiting)
    nextVisiting.add(field.id)
    const left = evaluateField(field.formula.leftFieldId, nextVisiting)
    const right = evaluateField(field.formula.rightFieldId, nextVisiting)

    if (left === null || right === null) {
      return null
    }

    let result: number

    if (field.formula.operator === '+') {
      result = left + right
    } else if (field.formula.operator === '-') {
      result = left - right
    } else if (field.formula.operator === '*') {
      result = left * right
    } else {
      if (right === 0) {
        return null
      }

      result = left / right
    }

    return Number.isFinite(result) ? result : null
  }

  return evaluateField(target.id, new Set())
}

export function normalizeCustomFieldValueForDefinition(
  field: CustomFieldDefinition,
  value: unknown,
): CustomFieldValue {
  if (field.type === 'select') {
    if (typeof value !== 'string') {
      throw new Error('Custom field value does not match field type')
    }

    const optionId = value.trim()

    if (!(field.options ?? []).some((option) => option.id === optionId)) {
      throw new Error('Custom field option not found')
    }

    return optionId
  }

  return normalizeCustomFieldValue(field.type, value)
}

export function normalizeCustomFieldValue(
  type: CustomFieldType,
  value: unknown,
): CustomFieldValue {
  if (type === 'text' && typeof value === 'string') {
    return value.trim()
  }

  if (
    type === 'number' &&
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (type === 'checkbox' && typeof value === 'boolean') {
    return value
  }

  if (type === 'date') {
    return normalizeDateCustomFieldValue(value)
  }

  throw new Error('Custom field value does not match field type')
}
