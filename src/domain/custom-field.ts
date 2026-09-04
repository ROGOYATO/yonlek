export type CustomFieldType = 'text' | 'number' | 'checkbox'
export type CustomFieldValue = string | number | boolean

export interface CustomFieldDefinition {
  id: string
  name: string
  type: CustomFieldType
  createdAt: string
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

  return {
    id: input.id,
    name,
    type: input.type,
    createdAt: input.now,
  }
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

  throw new Error('Custom field value does not match field type')
}
