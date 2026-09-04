export type MoveDirection = 'up' | 'down'

export function moveItemWithinGroup<T extends { id: string }>(
  items: T[],
  itemId: string,
  direction: MoveDirection,
  isPeer: (candidate: T, target: T) => boolean,
): T[] {
  const next = [...items]
  const targetIndex = items.findIndex((item) => item.id === itemId)

  if (targetIndex < 0) {
    return next
  }

  const target = items[targetIndex]
  const peerIndexes = items.flatMap((item, index) =>
    isPeer(item, target) ? [index] : [],
  )
  const peerPosition = peerIndexes.indexOf(targetIndex)
  const destinationPeerPosition =
    direction === 'up' ? peerPosition - 1 : peerPosition + 1
  const destinationIndex = peerIndexes[destinationPeerPosition]

  if (destinationIndex === undefined) {
    return next
  }

  ;[next[targetIndex], next[destinationIndex]] = [
    next[destinationIndex],
    next[targetIndex],
  ]

  return next
}
