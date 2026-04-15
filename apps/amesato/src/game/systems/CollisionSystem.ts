import type { CircleCollider } from '../core/types'

export function circlesIntersect(a: CircleCollider, b: CircleCollider) {
  const dx = a.position.x - b.position.x
  const dy = a.position.y - b.position.y
  const sum = a.radius + b.radius

  return dx * dx + dy * dy <= sum * sum
}
