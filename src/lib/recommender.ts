import { builtInRecipes } from '../data/all-recipes'
import type { DishRole, Ingredient, MealPlan, PlannedDish, Preferences, Recipe, Recommendation } from '../types'

export const defaultPreferences: Preferences = {
  people: 1, meal: '不限', maxMinutes: 30, difficulty: '不限', avoid: [], allergies: [], pantry: [], vegetarian: false, noSpicy: false, feast: false,
  menuMode: 'auto', meatCount: 0, vegetableCount: 0, soupCount: 0, stapleCount: 0
}

export interface RecipeSearchMatch {
  recipe: Recipe
  kind: 'exact' | 'contained'
}

const normalizeDishQuery = (query: string) => query
  .replace(/[，。！？、,.!?\s]/g, '')
  .replace(/^(?:我)?(?:想吃|想做|要吃|做一道|来一道|帮我找|帮我做|推荐一下|推荐|有没有)/, '')
  .replace(/(?:怎么做|的做法|菜谱|食谱)$/, '')

export function findRecipeSearchMatch(query: string, catalog: Recipe[] = builtInRecipes): RecipeSearchMatch | null {
  const normalized = normalizeDishQuery(query)
  if (normalized.length < 2) return null
  const searchable = catalog.filter((recipe) => ['主食', '早餐', '素菜', '荤菜', '水产', '汤'].includes(recipe.category))
  const exact = searchable.find((recipe) => recipe.name === normalized)
  if (exact) return { recipe: exact, kind: 'exact' }
  const embedded = searchable
    .filter((recipe) => query.includes(recipe.name) || recipe.name.includes(normalized))
    .sort((a, b) => b.name.length - a.name.length)[0]
  return embedded ? { recipe: embedded, kind: 'contained' } : null
}

export function recipeSearchConflict(recipe: Recipe, p: Preferences): string | null {
  if (containsAny(recipe, p.allergies)) return `「${recipe.name}」与当前过敏原设置冲突`
  if (containsAny(recipe, p.avoid)) return `「${recipe.name}」包含当前忌口食材`
  if (p.vegetarian && ['荤菜', '水产'].includes(recipe.category)) return `「${recipe.name}」不符合当前素食设置`
  if (p.noSpicy && recipe.tags.includes('辣')) return `「${recipe.name}」不符合当前不吃辣设置`
  return null
}

const splitItems = (value: string) => value.split(/[、，,和\s]+/).map((x) => x.trim()).filter(Boolean)
const chineseNumber = (value: string) => {
  if (/^\d+$/.test(value)) return Number(value)
  const digits: Record<string, number> = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  if (value === '十') return 10
  if (value.includes('十')) {
    const [tens, ones] = value.split('十')
    return (tens ? digits[tens] : 1) * 10 + (ones ? digits[ones] : 0)
  }
  return digits[value] ?? 0
}

export function parseQuery(query: string, current: Preferences = defaultPreferences): Preferences {
  const next: Preferences = { ...current, avoid: [...current.avoid], allergies: [...current.allergies], pantry: [...current.pantry] }
  const cn: Record<string, number> = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
  const people = query.match(/([1-9]|10|[一二两三四五六七八九十])\s*(?:个?人|人份)/)
  if (people) next.people = Number(people[1]) || cn[people[1]] || 1
  if (/早饭|早餐|早上/.test(query)) next.meal = '早餐'
  else if (/午饭|午餐|中午/.test(query)) next.meal = '午餐'
  else if (/晚饭|晚餐|晚上|今晚/.test(query)) next.meal = '晚餐'
  const minutes = query.match(/(\d+)\s*分钟/)
  if (minutes) next.maxMinutes = Math.max(5, Number(minutes[1]))
  if (/简单|新手|快手|不会做饭/.test(query)) next.difficulty = '新手'
  if (/素食|吃素|不要肉|不吃肉/.test(query)) next.vegetarian = true
  if (/丰盛|大餐|吃好点|硬菜/.test(query)) next.feast = true
  if (/不辣|不要辣|不能吃辣|不吃辣|清淡/.test(query)) { next.noSpicy = true; next.avoid = next.avoid.filter((item) => item !== '辣') }
  const allergy = query.match(/对([^，。；;]+?)过敏/) || query.match(/(?:过敏原是|过敏原|不能吃)(?:的是|：|:)?([^，。；;]+)/)
  if (allergy) next.allergies = [...new Set([...next.allergies, ...splitItems(allergy[1])])]
  const avoid = query.match(/(?:不吃|不要|忌口)([^，。；;]+)/)
  if (avoid && !/不吃肉|不吃辣/.test(avoid[0])) next.avoid = [...new Set([...next.avoid, ...splitItems(avoid[1])])]
  const pantry = query.match(/(?:只有|现有|有|用)([^，。；;]+?)(?:做|能做|可以做|$)/)
  if (pantry) next.pantry = [...new Set([...next.pantry, ...splitItems(pantry[1]).filter((x) => x.length <= 8)])]
  const structurePatterns: Array<[keyof Pick<Preferences, 'meatCount' | 'vegetableCount' | 'soupCount' | 'stapleCount'>, RegExp]> = [
    ['meatCount', /([零一二两三四五六七八九十\d]+)\s*(?:道|个)?\s*(?:荤菜|荤|肉菜)/],
    ['vegetableCount', /([零一二两三四五六七八九十\d]+)\s*(?:道|个)?\s*(?:素菜|素|青菜)/],
    ['soupCount', /([零一二两三四五六七八九十\d]+)\s*(?:道|个)?\s*(?:汤品|汤)/],
    ['stapleCount', /([零一二两三四五六七八九十\d]+)\s*(?:道|个)?\s*(?:主食)/]
  ]
  let hasCustomStructure = false
  for (const [key, pattern] of structurePatterns) {
    const match = query.match(pattern)
    if (match) { next[key] = Math.min(12, chineseNumber(match[1])); hasCustomStructure = true }
  }
  if (/不要汤|不需要汤|无汤/.test(query)) { next.soupCount = 0; hasCustomStructure = true }
  if (/主食(?:不用|不要|不需要)|不要主食/.test(query)) { next.stapleCount = 0; hasCustomStructure = true }
  if (hasCustomStructure) next.menuMode = 'custom'
  return next
}

function containsAny(recipe: Recipe, items: string[]) {
  const haystack = [recipe.name, ...recipe.ingredients.map((x) => x.name), ...recipe.tags].join('|')
  return items.some((item) => haystack.includes(item) || item.includes(recipe.name))
}

export function recommend(preferences: Preferences, excluded: string[] = [], catalog: Recipe[] = builtInRecipes): Recommendation[] {
  const candidates = catalog.filter((recipe) => {
    if (excluded.includes(recipe.id)) return false
    if (containsAny(recipe, [...preferences.avoid, ...preferences.allergies])) return false
    if (preferences.vegetarian && recipe.category === '荤菜') return false
    if (preferences.noSpicy && recipe.tags.includes('辣')) return false
    return true
  })

  return candidates.map((recipe) => {
    let score = 45 + Math.random() * 6
    const reasons: string[] = []
    if (preferences.meal === '不限' || recipe.meals.includes(preferences.meal)) { score += 18; reasons.push(`适合${preferences.meal === '不限' ? '这一餐' : preferences.meal}`) }
    else score -= 18
    if (recipe.minutes <= preferences.maxMinutes) { score += 14; reasons.push(`${recipe.minutes} 分钟左右能完成`) }
    else score -= Math.min(30, recipe.minutes - preferences.maxMinutes)
    if (preferences.difficulty === '不限' || recipe.difficulty === preferences.difficulty) { score += 10; reasons.push(`${recipe.difficulty}难度`) }
    if (preferences.pantry.length) {
      const matches = preferences.pantry.filter((item) => containsAny(recipe, [item]))
      score += matches.length * 14
      if (matches.length) reasons.push(`能用上${matches.slice(0, 3).join('、')}`)
    }
    if (preferences.noSpicy && recipe.tags.includes('不辣')) score += 5
    if (preferences.people === 1 && recipe.servings === 1) score += 4
    return { recipe, score, reasons: reasons.slice(0, 3) }
  }).sort((a, b) => b.score - a.score).slice(0, 3)
}

export function formatAmount(amount: number, baseServings: number, people: number, unit: string) {
  const value = amount * people / baseServings
  if (unit === '个' || unit === '根' || unit === '瓣') return `${Math.max(1, Math.round(value * 2) / 2)}${unit}`
  return `${value < 10 ? Math.round(value * 10) / 10 : Math.round(value)}${unit}`
}

export function formatIngredientAmount(ingredient: Ingredient, baseServings: number, people: number) {
  if (ingredient.scalable === false || !ingredient.amount || !ingredient.unit) return ingredient.originalAmount || '适量'
  const scaled = formatAmount(ingredient.amount, baseServings, people, ingredient.unit)
  if (!ingredient.originalAmount) return scaled
  if (people === baseServings) return ingredient.originalAmount
  return `${ingredient.originalAmount}（按当前人数约 ${scaled}）`
}

export function dishProfile(recipe: Recipe): { role: DishRole; protein: string; method: string } {
  const text = [recipe.name, recipe.category, ...recipe.tags, ...recipe.ingredients.map((x) => x.name)].join('|')
  const role: DishRole = recipe.category === '主食' || recipe.category === '早餐' ? '主食' : recipe.category === '汤' ? '汤' : ['荤菜', '水产'].includes(recipe.category) ? '荤菜' : '素菜'
  const protein = /虾|蟹|蛏|贝/.test(text) ? '虾蟹' : /鱼|鲈/.test(text) ? '鱼' : /鸡翅|鸡腿|鸡肉|鸡丁/.test(text) ? '鸡' : /排骨|猪|五花/.test(text) ? '猪' : /牛蛙|蛙肉/.test(text) ? '蛙' : /牛肉|牛腩|牛柳|牛排|牛肋|牛骨|肥牛/.test(text) ? '牛' : /羊/.test(text) ? '羊' : /鸡蛋|蛋花|炒蛋|蛋炒/.test(text) ? '蛋' : /豆腐/.test(text) ? '豆制品' : role === '素菜' ? '蔬菜' : '其他'
  const method = /蒸|羹/.test(text) ? '蒸' : /炖|焖/.test(text) ? '炖' : /凉拌/.test(text) ? '凉拌' : /煮|汤|面/.test(text) ? '煮' : /煎/.test(text) ? '煎' : '炒'
  return { role, protein, method }
}

function isAllowed(recipe: Recipe, p: Preferences) {
  if (!['主食', '早餐', '素菜', '荤菜', '水产', '汤'].includes(recipe.category)) return false
  if (containsAny(recipe, [...p.avoid, ...p.allergies])) return false
  if (p.vegetarian && ['荤菜', '水产'].includes(recipe.category)) return false
  if (p.noSpicy && recipe.tags.includes('辣')) return false
  if (p.meal !== '不限' && !recipe.meals.includes(p.meal)) return false
  return true
}

function baseScore(recipe: Recipe, p: Preferences, recent: string[]) {
  let score = 55
  if (recipe.minutes <= p.maxMinutes) score += 15
  else score -= Math.min(25, recipe.minutes - p.maxMinutes)
  if (p.difficulty === '不限' || recipe.difficulty === p.difficulty) score += 8
  if (p.people === 1 && recipe.servings === 1) score += 6
  const pantryMatches = p.pantry.filter((item) => containsAny(recipe, [item])).length
  score += pantryMatches * 80
  if (recent.includes(recipe.id)) score -= 35
  return score
}

function weightedPick(pool: Recipe[], p: Preferences, recent: string[], usedProteins: Set<string>, usedMethods: Set<string>) {
  if (!pool.length) return undefined
  const ranked = pool.map((recipe) => {
    const profile = dishProfile(recipe)
    let score = baseScore(recipe, p, recent) + Math.random() * 24
    if (usedProteins.has(profile.protein) && !['蔬菜', '其他'].includes(profile.protein)) score -= 24
    if (usedMethods.has(profile.method)) score -= 7
    return { recipe, score }
  }).sort((a, b) => b.score - a.score)
  const window = ranked.slice(0, Math.min(5, ranked.length))
  return window[Math.floor(Math.random() * Math.min(3, window.length))]?.recipe
}

function planShape(p: Preferences) {
  if (p.menuMode === 'custom') return { staples: p.stapleCount, proteins: p.vegetarian ? 0 : p.meatCount, vegetables: p.vegetableCount, soups: p.soupCount }
  if (p.people <= 1) {
    if (p.meal === '早餐') return { staples: 1, proteins: 0, vegetables: 0, soups: 0 }
    if (p.feast) return { staples: 0, proteins: p.vegetarian ? 0 : 1, vegetables: 1, soups: 0 }
    const chooseMainDish = Math.random() > .5
    return chooseMainDish ? { staples: 0, proteins: p.vegetarian ? 0 : 1, vegetables: p.vegetarian ? 1 : 0, soups: 0 } : { staples: 1, proteins: 0, vegetables: Math.random() > .65 ? 1 : 0, soups: 0 }
  }
  if (p.people === 2) return { staples: 1, proteins: p.vegetarian ? 0 : 1, vegetables: 1, soups: 0 }
  if (p.people <= 4) return { staples: 0, proteins: p.vegetarian ? 0 : 2, vegetables: p.vegetarian ? 3 : 2, soups: 1 }
  if (p.people <= 6) return { staples: 0, proteins: p.vegetarian ? 0 : 3, vegetables: p.vegetarian ? 5 : 2, soups: 1 }
  if (p.people <= 8) return { staples: 0, proteins: p.vegetarian ? 0 : 4, vegetables: p.vegetarian ? 6 : 2, soups: 1 }
  return { staples: 1, proteins: p.vegetarian ? 0 : 4, vegetables: p.vegetarian ? 7 : 3, soups: 1 }
}

function createMealPlan(p: Preferences, chosen: Recipe[], recent: string[]): MealPlan {
  const dishes: PlannedDish[] = chosen.map((recipe) => {
    const profile = dishProfile(recipe)
    return { recipe, score: baseScore(recipe, p, recent), reasons: [], ...profile }
  })
  const dishCount = dishes.filter((x) => x.role !== '汤').length
  const soupCount = dishes.filter((x) => x.role === '汤').length
  const proteinNames = [...new Set(dishes.map((x) => x.protein).filter((x) => !['蔬菜', '其他'].includes(x)))]
  const reasons = [
    ...(p.pantry.length ? [`优先用上${p.pantry.filter((item) => dishes.some((dish) => containsAny(dish.recipe, [item]))).join('、') || '现有食材'}`] : []),
    proteinNames.length > 1 ? `${proteinNames.join('、')}等蛋白质来源不重复` : proteinNames.length ? `包含${proteinNames[0]}类蛋白质` : '以蔬菜和主食为主',
    dishes.some((x) => x.role === '素菜') ? '搭配蔬菜，减少整桌油腻感' : '适合一人快速完成',
    `${new Set(dishes.map((x) => x.method)).size} 种烹饪方式交替搭配`
  ]
  const longFirst = [...dishes].sort((a, b) => b.recipe.minutes - a.recipe.minutes)
  const cookingOrder = longFirst.map((dish, index) => index === 0 ? `先准备${dish.recipe.name}，它的耗时最长（约 ${dish.recipe.minutes} 分钟）` : dish.method === '凉拌' ? `${dish.recipe.name}可提前完成并静置入味` : `${dish.recipe.name}安排在${index === longFirst.length - 1 ? '最后制作，趁热上桌' : '前一道烹饪期间备料'}`)
  return {
    id: dishes.map((x) => x.recipe.id).join('--'),
    title: p.menuMode === 'custom' ? `${p.people} 人餐 · ${[`${p.meatCount} 荤`, `${p.vegetableCount} 素`, p.soupCount ? `${p.soupCount} 汤` : '', p.stapleCount ? `${p.stapleCount} 主食` : ''].filter(Boolean).join(' · ')}` : p.people === 1 ? (dishes.length > 1 ? '一人食 · 一主一配' : '一人食 · 快手一餐') : `${p.people} 人餐 · ${dishCount} 菜${soupCount ? `一汤` : ''}`,
    summary: dishes.map((x) => x.recipe.name).join('、'), dishes,
    estimatedMinutes: Math.max(...dishes.map((x) => x.recipe.minutes)) + Math.max(0, dishes.length - 2) * 8,
    reasons, cookingOrder
  }
}

export function generateMealPlan(p: Preferences, recent: string[] = [], seedExcluded: string[] = [], catalog: Recipe[] = builtInRecipes, lockedRecipe?: Recipe): MealPlan {
  const eligible = catalog.filter((recipe) => isAllowed(recipe, p) && !seedExcluded.includes(recipe.id))
  const shape = planShape(p)
  if (lockedRecipe) {
    const lockedRole = dishProfile(lockedRecipe).role
    if (lockedRole === '主食') shape.staples = Math.max(1, shape.staples)
    else if (lockedRole === '荤菜') shape.proteins = Math.max(1, shape.proteins)
    else if (lockedRole === '素菜') shape.vegetables = Math.max(1, shape.vegetables)
    else shape.soups = Math.max(1, shape.soups)
  }
  const chosen: Recipe[] = lockedRecipe ? [lockedRecipe] : []
  const proteins = new Set<string>()
  const methods = new Set<string>()
  if (lockedRecipe) {
    const profile = dishProfile(lockedRecipe)
    proteins.add(profile.protein)
    methods.add(profile.method)
  }
  const totalTarget = shape.staples + shape.proteins + shape.vegetables + shape.soups
  for (const pantryItem of p.pantry) {
    if (chosen.length >= totalTarget) break
    const matching = eligible.filter((recipe) => !chosen.includes(recipe) && containsAny(recipe, [pantryItem]) && ['主食', '荤菜', '素菜', '汤'].includes(dishProfile(recipe).role))
    const visibleKeyword = pantryItem.replace(/肉$|仁$|片$|块$/g, '')
    const nameMatched = matching.filter((recipe) => recipe.name.includes(pantryItem) || (visibleKeyword.length >= 1 && recipe.name.includes(visibleKeyword)))
    const picked = weightedPick(nameMatched.length ? nameMatched : matching, p, recent, proteins, methods)
    if (!picked) continue
    const profile = dishProfile(picked)
    const roleCapacity = profile.role === '主食' ? shape.staples : profile.role === '荤菜' ? shape.proteins : profile.role === '素菜' ? shape.vegetables : shape.soups
    if (chosen.filter((recipe) => dishProfile(recipe).role === profile.role).length >= roleCapacity) continue
    chosen.push(picked); proteins.add(profile.protein); methods.add(profile.method)
  }
  const take = (role: DishRole, count: number) => {
    const alreadyChosen = chosen.filter((recipe) => dishProfile(recipe).role === role).length
    for (let i = alreadyChosen; i < count; i++) {
      let pool = eligible.filter((recipe) => dishProfile(recipe).role === role && !chosen.includes(recipe))
      if (role === '荤菜') {
        const distinct = pool.filter((recipe) => !proteins.has(dishProfile(recipe).protein))
        if (distinct.length) pool = distinct
      }
      if (role === '素菜' && p.people >= 3 && !p.vegetarian) {
        const actualVegetables = pool.filter((recipe) => dishProfile(recipe).protein === '蔬菜')
        if (actualVegetables.length) pool = actualVegetables
      }
      const picked = weightedPick(pool, p, recent, proteins, methods)
      if (!picked) continue
      chosen.push(picked); const profile = dishProfile(picked); proteins.add(profile.protein); methods.add(profile.method)
    }
  }
  take('主食', shape.staples)
  take('荤菜', shape.proteins)
  take('素菜', shape.vegetables)
  take('汤', shape.soups)
  if (!chosen.length) {
    const fallback = eligible[0] || catalog[0] || builtInRecipes[0]
    chosen.push(fallback)
  }
  return createMealPlan(p, chosen, recent)
}

export function replaceDishInMealPlan(plan: MealPlan, recipeId: string, p: Preferences, recent: string[] = [], catalog: Recipe[] = builtInRecipes): MealPlan {
  const currentIndex = plan.dishes.findIndex((dish) => dish.recipe.id === recipeId)
  if (currentIndex < 0) return plan
  const currentDish = plan.dishes[currentIndex]
  const otherRecipes = plan.dishes.filter((_, index) => index !== currentIndex).map((dish) => dish.recipe)
  const excludedIds = new Set([...plan.dishes.map((dish) => dish.recipe.id), recipeId])
  const strictCandidates = catalog.filter((recipe) => {
    if (excludedIds.has(recipe.id) || !isAllowed(recipe, p)) return false
    if (dishProfile(recipe).role !== currentDish.role) return false
    if (recipe.minutes > p.maxMinutes) return false
    if (p.difficulty !== '不限' && recipe.difficulty !== p.difficulty) return false
    return true
  })
  const usedProteins = new Set(otherRecipes.map((recipe) => dishProfile(recipe).protein))
  const usedMethods = new Set(otherRecipes.map((recipe) => dishProfile(recipe).method))
  const replacement = weightedPick(strictCandidates, p, [recipeId, ...recent], usedProteins, usedMethods)
  if (!replacement) return plan
  const nextRecipes = plan.dishes.map((dish, index) => index === currentIndex ? replacement : dish.recipe)
  return createMealPlan(p, nextRecipes, [recipeId, ...recent])
}

export function generateMealPlans(p: Preferences, recent: string[] = [], count = 3, catalog: Recipe[] = builtInRecipes, lockedRecipe?: Recipe): MealPlan[] {
  const plans: MealPlan[] = []
  for (let i = 0; i < count; i++) {
    const excluded = i === 0 ? [] : plans.flatMap((plan) => plan.dishes.map((x) => x.recipe.id)).slice(-Math.max(2, Math.floor(catalog.length / 3)))
    plans.push(generateMealPlan(p, recent, excluded, catalog, lockedRecipe))
  }
  return plans
}
