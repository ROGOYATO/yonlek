import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  type ViewPreferences,
} from '../domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './view-preferences-storage'
import type { KeyValueStore } from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const storageKey = 'workspace-app.view-preferences'
const textFilter = {
  fieldId: 'field-text',
  fieldType: 'text' as const,
  value: 'camera',
}
const dateFilter = {
  fieldId: 'field-date',
  fieldType: 'date' as const,
  value: '2026-09-21',
}

describe('Custom Field filter/sort preference storage', () => {
  it('round-trips top-level, per-view, saved-filter, and saved-view state in version 1', () => {
    const storage = new MemoryStore()
    const preferences: ViewPreferences = {
      ...createDefaultViewPreferences(),
      customFieldFilter: textFilter,
      customFieldSortFieldId: 'field-score',
      viewMode: 'board',
      filterSortByView: {
        list: {
          query: 'list',
          status: 'all',
          priority: 'all',
          dueDate: 'all',
          sort: 'created',
          customFieldFilter: dateFilter,
          customFieldSortFieldId: 'field-date',
        },
      },
      savedFilterSets: [
        {
          name: 'Camera filter',
          query: '',
          status: 'all',
          priority: 'all',
          dueDate: 'all',
          customFieldFilter: textFilter,
        },
      ],
      savedViews: [
        {
          name: 'Camera view',
          projectView: 'all',
          query: '',
          status: 'all',
          priority: 'all',
          dueDate: 'all',
          sort: 'created',
          group: 'none',
          customFieldFilter: dateFilter,
          customFieldSortFieldId: 'field-date',
        },
      ],
    }

    saveViewPreferences(storage, preferences)

    expect(loadViewPreferences(storage)).toEqual(preferences)
  })

  it('keeps older version-1 preference documents valid', () => {
    const storage = new MemoryStore()
    const legacy = {
      ...createDefaultViewPreferences(),
      query: 'legacy',
      sort: 'title' as const,
    }

    storage.setItem(
      storageKey,
      JSON.stringify({ version: 1, preferences: legacy }),
    )

    expect(loadViewPreferences(storage)).toEqual(legacy)
  })

  it('falls back for malformed Custom Field filter/sort structures wherever they are stored', () => {
    const defaults = createDefaultViewPreferences()
    const invalidPreferences = [
      {
        ...defaults,
        customFieldFilter: {
          fieldId: ' ',
          fieldType: 'text',
          value: 'camera',
        },
      },
      {
        ...defaults,
        customFieldFilter: {
          fieldId: 'field-number',
          fieldType: 'number',
          value: '4',
        },
      },
      {
        ...defaults,
        customFieldFilter: {
          fieldId: 'field-date',
          fieldType: 'date',
          value: '2026-02-30',
        },
      },
      {
        ...defaults,
        customFieldSortFieldId: ' ',
      },
      {
        ...defaults,
        filterSortByView: {
          list: {
            query: '',
            status: 'all',
            priority: 'all',
            dueDate: 'all',
            sort: 'created',
            customFieldFilter: {
              fieldId: 'field-checkbox',
              fieldType: 'checkbox',
              value: 'true',
            },
          },
        },
      },
      {
        ...defaults,
        savedFilterSets: [
          {
            name: 'Invalid filter',
            query: '',
            status: 'all',
            priority: 'all',
            dueDate: 'all',
            customFieldFilter: {
              fieldId: 'field-select',
              fieldType: 'select',
              value: '',
            },
          },
        ],
      },
      {
        ...defaults,
        savedViews: [
          {
            name: 'Invalid view',
            projectView: 'all',
            query: '',
            status: 'all',
            priority: 'all',
            dueDate: 'all',
            sort: 'created',
            group: 'none',
            customFieldSortFieldId: '',
          },
        ],
      },
    ]

    for (const preferences of invalidPreferences) {
      const storage = new MemoryStore()
      storage.setItem(
        storageKey,
        JSON.stringify({ version: 1, preferences }),
      )
      expect(loadViewPreferences(storage)).toEqual(defaults)
    }
  })
})
