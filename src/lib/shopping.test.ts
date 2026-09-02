import { describe, expect, it } from 'vitest'
import { dishProfile } from './recommender'
import { buildShoppingList, shoppingListToText } from './shopping'
import { recipes } from '../data/recipes'
import type { MealPlan } from '../types'

const tomatoEggs = recipes.find((recipe) => recipe.id === 'tomato-eggs')!
const steamedEgg = recipes.find((recipe) => recipe.id === 'steamed-egg')!
const plan: MealPlan = {
  id: 'shopping-test',
  title: '购物测试',
  summary: `${tomatoEggs.name}、${steamedEgg.name}`,
  estimatedMinutes: 18,
  reasons: [],
  cookingOrder: [],
  dishes: [tomatoEggs, steamedEgg].map((recipe) => ({ recipe, score: 1, reasons: [], ...dishProfile(recipe) }))
}

describe('shopping list', () => {
  it('merges matching ingredients and scales them for the table', () => {
    const items = buildShoppingList(plan, 2)
    expect(items.find((item) => item.id === '鸡蛋-个')).toMatchObject({ name: '鸡蛋', amount: '7个' })
    expect(items.filter((item) => item.name === '盐')).toHaveLength(1)
  })

  it('copies only unpurchased items as clean plain text', () => {
    const items = buildShoppingList(plan, 2)
    const purchased = new Set([items.find((item) => item.name === '鸡蛋')!.id])
    const text = shoppingListToText(items, purchased)
    expect(text).toMatch(/^今日买菜清单\n\n/)
    expect(text).toContain('西红柿 2个')
    expect(text).not.toContain('鸡蛋 7个')
    expect(shoppingListToText(items, new Set(items.map((item) => item.id)))).toBe('')
  })
})
