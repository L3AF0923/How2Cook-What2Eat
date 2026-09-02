import type { MealPlan } from '../types'

export interface ShoppingListItem {
  id: string
  name: string
  amount: string
  optional: boolean
}

function formatMergedAmount(amount: number, unit: string) {
  if (['个', '根', '瓣'].includes(unit)) return `${Math.max(1, Math.round(amount * 2) / 2)}${unit}`
  return `${amount < 10 ? Math.round(amount * 10) / 10 : Math.round(amount)}${unit}`
}

export function buildShoppingList(plan: MealPlan, people: number): ShoppingListItem[] {
  const merged = new Map<string, { name: string; amount: number; unit: string; optional: boolean; originalAmount?: string }>()
  plan.dishes.forEach(({ recipe }) => recipe.ingredients.forEach((ingredient) => {
    const usesOriginal = ingredient.scalable === false || !ingredient.amount || !ingredient.unit
    const id = usesOriginal ? `${ingredient.name}-原始-${ingredient.originalAmount || '适量'}` : `${ingredient.name}-${ingredient.unit}`
    const scaled = ingredient.amount * people / recipe.servings
    const existing = merged.get(id)
    merged.set(id, {
      name: ingredient.name,
      amount: usesOriginal ? 0 : (existing?.amount || 0) + scaled,
      unit: ingredient.unit,
      optional: Boolean(ingredient.optional && (existing?.optional ?? true)),
      originalAmount: usesOriginal ? ingredient.originalAmount || '适量' : undefined
    })
  }))
  return [...merged.entries()].map(([id, item]) => ({
    id,
    name: item.name,
    amount: item.originalAmount || formatMergedAmount(item.amount, item.unit),
    optional: item.optional
  }))
}

export function shoppingListToText(items: ShoppingListItem[], purchasedIds: ReadonlySet<string>) {
  const remaining = items.filter((item) => !purchasedIds.has(item.id))
  if (!remaining.length) return ''
  return ['今日买菜清单', '', ...remaining.map((item) => `${item.name} ${item.amount}${item.optional ? '（可选）' : ''}`)].join('\n')
}
