export type CustomFieldType = 'text' | 'number' | 'checkbox' | 'select' | 'date'
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
