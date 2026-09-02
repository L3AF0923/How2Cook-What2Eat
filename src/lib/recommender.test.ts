import { describe, expect, it } from 'vitest'
import { defaultPreferences, dishProfile, findRecipeSearchMatch, formatAmount, formatIngredientAmount, generateMealPlan, generateMealPlans, parseQuery, recipeSearchConflict, recommend, replaceDishInMealPlan } from './recommender'
import { recipes } from '../data/recipes'
import { builtInRecipes } from '../data/all-recipes'
import type { MealPlan, Recipe } from '../types'

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
  it('finds a directly entered dish name and conversational dish request', () => {
    expect(findRecipeSearchMatch('糖醋排骨', builtInRecipes)?.recipe.name).toBe('糖醋排骨')
    expect(findRecipeSearchMatch('我想吃糖醋排骨', builtInRecipes)?.recipe.name).toBe('糖醋排骨')
  })
  it('locks a specifically searched dish into the generated table', () => {
    const target = findRecipeSearchMatch('糖醋排骨', builtInRecipes)!.recipe
    const plans = generateMealPlans({ ...defaultPreferences, people: 2, meal: '晚餐' }, [], 1, builtInRecipes, target)
    expect(plans).toHaveLength(1)
    expect(plans[0].dishes.some((dish) => dish.recipe.id === target.id)).toBe(true)
    expect(new Set(plans[0].dishes.map((dish) => dish.recipe.id)).size).toBe(plans[0].dishes.length)
  })
  it('reports strict conflicts before locking a searched dish', () => {
    const target = findRecipeSearchMatch('糖醋排骨', builtInRecipes)!.recipe
    expect(recipeSearchConflict(target, { ...defaultPreferences, allergies: ['排骨'] })).toContain('过敏原')
    expect(recipeSearchConflict(target, { ...defaultPreferences, vegetarian: true })).toContain('素食')
    const spicy = builtInRecipes.find((recipe) => recipe.tags.includes('辣'))!
    expect(recipeSearchConflict(spicy, { ...defaultPreferences, noSpicy: true })).toContain('不吃辣')
  })
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
  it('replaces only one dish with the same role and strict active filters', () => {
    const oldMeat = recipes.find((recipe) => recipe.id === 'cola-wings')!
    const vegetable = recipes.find((recipe) => recipe.id === 'tomato-eggs')!
    const allowedReplacement: Recipe = { ...oldMeat, id: 'quick-chicken', name: '快手鸡丁', minutes: 20, difficulty: '新手', ingredients: [{ name: '鸡肉', amount: 250, unit: 'g' }] }
    const tooSlow: Recipe = { ...allowedReplacement, id: 'slow-chicken', name: '慢炖鸡', minutes: 80 }
    const wrongRole: Recipe = { ...vegetable, id: 'another-vegetable', name: '另一道素菜', minutes: 10, difficulty: '新手' }
    const allergen: Recipe = { ...allowedReplacement, id: 'shrimp-chicken', name: '虾仁鸡丁', ingredients: [{ name: '虾', amount: 100, unit: 'g' }] }
    const oldProfile = dishProfile(oldMeat)
    const vegetableProfile = dishProfile(vegetable)
    const plan: MealPlan = {
      id: 'old-plan', title: '测试菜单', summary: `${oldMeat.name}、${vegetable.name}`, estimatedMinutes: 35, reasons: [], cookingOrder: [],
      dishes: [
        { recipe: oldMeat, score: 1, reasons: [], ...oldProfile },
        { recipe: vegetable, score: 1, reasons: [], ...vegetableProfile }
      ]
    }
    const preferences = { ...defaultPreferences, people: 2, meal: '晚餐' as const, maxMinutes: 30, difficulty: '新手' as const, allergies: ['虾'] }
    const next = replaceDishInMealPlan(plan, oldMeat.id, preferences, [], [oldMeat, vegetable, allowedReplacement, tooSlow, wrongRole, allergen])
    expect(next.dishes[0].recipe.id).toBe(allowedReplacement.id)
    expect(next.dishes[0].role).toBe(oldProfile.role)
    expect(next.dishes[1].recipe.id).toBe(vegetable.id)
    expect(new Set(next.dishes.map((dish) => dish.recipe.id)).size).toBe(next.dishes.length)
    expect(next.summary).toContain(allowedReplacement.name)
    expect(next.cookingOrder).not.toHaveLength(0)
  })
})
