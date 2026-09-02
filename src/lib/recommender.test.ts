import { describe, expect, it } from 'vitest'
import { defaultPreferences, dishProfile, formatAmount, formatIngredientAmount, generateMealPlan, generateMealPlans, parseQuery, recommend } from './recommender'
import { recipes } from '../data/recipes'
import { builtInRecipes } from '../data/all-recipes'

describe('query parser', () => {
  it('parses people, meal, time and taste', () => {
    const result = parseQuery('帮我推荐两个人的午餐，不辣，20 分钟以内')
    expect(result.people).toBe(2)
    expect(result.meal).toBe('午餐')
    expect(result.maxMinutes).toBe(20)
    expect(result.noSpicy).toBe(true)
  })
  it('parses conversational allergy wording', () => {
    expect(parseQuery('我对虾过敏，推荐晚餐').allergies).toContain('虾')
  })
  it('does not turn no-spicy preference into a literal avoid keyword', () => {
    const result = parseQuery('八个人晚餐，不吃辣')
    expect(result.noSpicy).toBe(true)
    expect(result.avoid).not.toContain('辣')
  })
  it('recognizes a rich one-person dinner', () => {
    const parsed = parseQuery('一人食丰盛晚餐')
    const plan = generateMealPlan(parsed)
    expect(parsed.feast).toBe(true)
    expect(plan.dishes.some((dish) => dish.role === '荤菜')).toBe(true)
    expect(plan.dishes.some((dish) => dish.role === '素菜')).toBe(true)
  })
  it('parses and strictly applies a custom six-meat two-vegetable one-soup menu', () => {
    const parsed = parseQuery('十人份六荤二素一汤')
    expect(parsed).toMatchObject({ people: 10, menuMode: 'custom', meatCount: 6, vegetableCount: 2, soupCount: 1, stapleCount: 0 })
    const plans = generateMealPlans(parsed, [], 3)
    for (const plan of plans) {
      expect(plan.dishes.filter((dish) => dish.role === '荤菜')).toHaveLength(6)
      expect(plan.dishes.filter((dish) => dish.role === '素菜')).toHaveLength(2)
      expect(plan.dishes.filter((dish) => dish.role === '汤')).toHaveLength(1)
      expect(plan.dishes.filter((dish) => dish.role === '主食')).toHaveLength(0)
    }
  })
})

describe('ingredient amount display', () => {
  it('preserves HowToCook ranges and notes', () => {
    expect(formatIngredientAmount({ name: '豆瓣酱', amount: 30, unit: 'g', scalable: false, originalAmount: '30-50 g' }, 2, 1)).toBe('30-50 g')
    expect(formatIngredientAmount({ name: '螃蟹', amount: 500, unit: 'g', scalable: true, originalAmount: '500 g（约 3-4 只中等河蟹）' }, 2, 2)).toBe('500 g（约 3-4 只中等河蟹）')
    expect(formatIngredientAmount({ name: '螃蟹', amount: 500, unit: 'g', scalable: true, originalAmount: '500 g（约 3-4 只中等河蟹）' }, 2, 1)).toContain('按当前人数约 250g')
  })
})

describe('recommender', () => {
  it('strictly excludes an allergen', () => {
    const result = recommend({ ...defaultPreferences, allergies: ['鸡蛋'] })
    expect(result.every(({ recipe }) => recipe.ingredients.every((item) => !item.name.includes('鸡蛋')))).toBe(true)
  })
  it('scales ingredient quantities', () => {
    expect(formatAmount(100, 2, 3, 'g')).toBe('150g')
  })
  it('builds six dishes and one soup for eight people', () => {
    const plan = generateMealPlan({ ...defaultPreferences, people: 8, maxMinutes: 90 })
    expect(plan.dishes.filter((x) => x.role !== '汤')).toHaveLength(6)
    expect(plan.dishes.filter((x) => x.role === '汤')).toHaveLength(1)
    const meatProteins = plan.dishes.filter((x) => x.role === '荤菜').map((x) => x.protein)
    expect(new Set(meatProteins).size).toBe(meatProteins.length)
    expect(plan.dishes.filter((x) => x.role === '素菜').every((x) => x.protein === '蔬菜')).toBe(true)
  })
  it('uses direct markdown source links for every recipe', () => {
    expect(recipes.every((recipe) => recipe.source.includes('/blob/master/') && recipe.source.endsWith('.md'))).toBe(true)
    expect(dishProfile(recipes.find((x) => x.id === 'boiled-shrimp')!).protein).toBe('虾蟹')
  })
  it('loads the complete HowToCook recipe catalog', () => {
    expect(builtInRecipes.length).toBeGreaterThanOrEqual(345)
  })
  it('prioritizes multiple available pantry ingredients', () => {
    const plan = generateMealPlan({ ...defaultPreferences, people: 4, meal: '晚餐', maxMinutes: 120, pantry: ['牛肉', '虾'] })
    const recipeText = plan.dishes.map((dish) => `${dish.recipe.name}|${dish.recipe.ingredients.map((item) => item.name).join('|')}`).join('|')
    expect(recipeText).toMatch(/牛肉|牛腩|牛柳|牛排/)
    expect(recipeText).toContain('虾')
    expect(plan.dishes.some((dish) => /牛/.test(dish.recipe.name))).toBe(true)
    expect(plan.dishes.some((dish) => /虾/.test(dish.recipe.name))).toBe(true)
  })
})
