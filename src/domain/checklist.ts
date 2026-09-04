export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface CreateChecklistItemInput {
  id: string
  text: string
}

export function createChecklistItem(
  input: CreateChecklistItemInput,
): ChecklistItem {
  const text = input.text.trim()

  if (!text) {
    throw new Error('Checklist item text is required')
  }

  return {
    id: input.id,
    text,
    completed: false,
  }
}

export function renameChecklistItem(
  item: ChecklistItem,
  nextText: string,
): ChecklistItem {
  const text = nextText.trim()

  if (!text) {
    throw new Error('Checklist item text is required')
  }

  return {
    ...item,
    text,
  }
}

export function setChecklistItemCompleted(
  item: ChecklistItem,
  completed: boolean,
): ChecklistItem {
  return {
    ...item,
    completed,
  }
}
