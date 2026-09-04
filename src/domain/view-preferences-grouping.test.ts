import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { TaskGroup } from './task-group'
import type { ViewPreferences } from './view-preferences'

type GetTaskGroupFn = (preferences: ViewPreferences) => TaskGroup

describe('view preference task grouping', () => {
  it('defaults to no grouping and updates grouping without mutating the previous preferences', () => {
    const current = viewPreferenceDomain.createDefaultViewPreferences()
    const getTaskGroup = (
      viewPreferenceDomain as unknown as { getTaskGroup: GetTaskGroupFn }
    ).getTaskGroup

    expect(getTaskGroup(current)).toBe('none')

    const next = viewPreferenceDomain.updateViewPreferences(current, {
      group: 'priority',
    } as Partial<ViewPreferences>)

    expect(getTaskGroup(next)).toBe('priority')
    expect(current).toEqual(viewPreferenceDomain.createDefaultViewPreferences())
  })
})
