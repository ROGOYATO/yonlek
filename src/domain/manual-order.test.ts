import { describe, expect, it } from 'vitest'

import * as manualOrderDomain from './manual-order'

interface Item {
  id: string
  group: string
}

function moveItemWithinGroup() {
  return (
    manualOrderDomain as typeof manualOrderDomain & {
      moveItemWithinGroup?: (
        items: Item[],
        itemId: string,
        direction: 'up' | 'down',
        isPeer: (candidate: Item, target: Item) => boolean,
      ) => Item[]
    }
  ).moveItemWithinGroup
}

const sameGroup = (candidate: Item, target: Item) =>
  candidate.group === target.group

describe('moveItemWithinGroup', () => {
  it('moves an item relative to its nearest peer without moving unrelated items', () => {
    const items = [
      { id: 'a-1', group: 'a' },
      { id: 'b-1', group: 'b' },
      { id: 'a-2', group: 'a' },
    ]

    const next = moveItemWithinGroup()?.(
      items,
      'a-2',
      'up',
      sameGroup,
    )

    expect(next?.map((item) => item.id)).toEqual([
      'a-2',
      'b-1',
      'a-1',
    ])
    expect(items.map((item) => item.id)).toEqual([
      'a-1',
      'b-1',
      'a-2',
    ])
  })

  it('moves an item down among peers', () => {
    const items = [
      { id: 'a-1', group: 'a' },
      { id: 'b-1', group: 'b' },
      { id: 'a-2', group: 'a' },
    ]

    expect(
      moveItemWithinGroup()?.(items, 'a-1', 'down', sameGroup)
        .map((item) => item.id),
    ).toEqual(['a-2', 'b-1', 'a-1'])
  })

  it('returns an unchanged copy at a boundary or for a missing item', () => {
    const items = [
      { id: 'a-1', group: 'a' },
      { id: 'a-2', group: 'a' },
    ]

    const boundary = moveItemWithinGroup()?.(
      items,
      'a-1',
      'up',
      sameGroup,
    )
    const missing = moveItemWithinGroup()?.(
      items,
      'missing',
      'down',
      sameGroup,
    )

    expect(boundary).toEqual(items)
    expect(missing).toEqual(items)
    expect(boundary).not.toBe(items)
    expect(missing).not.toBe(items)
  })
})
