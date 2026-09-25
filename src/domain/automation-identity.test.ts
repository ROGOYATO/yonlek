import { describe, expect, it } from 'vitest'

import { createAutomationIdentity } from './automation'

describe('Automation identity', () => {
  it('normalizes a stable id and name while preserving enabled state', () => {
    const automation = createAutomationIdentity({
      id: '  automation-1  ',
      name: '  Daily triage  ',
      enabled: true,
    })

    expect(automation).toEqual({
      id: 'automation-1',
      name: 'Daily triage',
      enabled: true,
    })
  })

  it('rejects a blank Automation id', () => {
    expect(() =>
      createAutomationIdentity({
        id: '   ',
        name: 'Daily triage',
        enabled: true,
      }),
    ).toThrow('Automation id is required')
  })

  it('rejects a blank Automation name', () => {
    expect(() =>
      createAutomationIdentity({
        id: 'automation-1',
        name: '   ',
        enabled: true,
      }),
    ).toThrow('Automation name is required')
  })
})
