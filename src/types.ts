export type Meal = '早餐' | '午餐' | '晚餐' | '不限'
export type Difficulty = '新手' | '普通' | '进阶'

export interface Ingredient {
  name: string
  amount: number
  unit: string
  scalable?: boolean
  optional?: boolean
  originalAmount?: string
}

export interface Recipe {
  id: string
  name: string
  category: string
  description: string
  servings: number
  minutes: number
  difficulty: Difficulty
  calories?: number
  meals: Meal[]
  tags: string[]
  ingredients: Ingredient[]
  tools: string[]
  steps: string[]
  tips: string[]
  source: string
}

export interface Preferences {
  people: number
  meal: Meal
  maxMinutes: number
  difficulty: Difficulty | '不限'
  avoid: string[]
  allergies: string[]
  pantry: string[]
  vegetarian: boolean
  noSpicy: boolean
  feast: boolean
  menuMode: 'auto' | 'custom'
  meatCount: number
  vegetableCount: number
  soupCount: number
  stapleCount: number
}

export interface Recommendation {
  recipe: Recipe
  score: number
  reasons: string[]
}

export type DishRole = '主食' | '荤菜' | '素菜' | '汤'

export interface PlannedDish extends Recommendation {
  role: DishRole
  protein: string
  method: string
}

export interface MealPlan {
  id: string
  title: string
  summary: string
  dishes: PlannedDish[]
  estimatedMinutes: number
  reasons: string[]
  cookingOrder: string[]
}

export type CookingTimerStatus = 'running' | 'paused' | 'finished'

export interface CookingTimerState {
  id: string
  recipeId: string
  stepIndex: number
  label: string
  durationMs: number
  status: CookingTimerStatus
  targetEndAt: number | null
  remainingMs: number
}

export interface CookingProgress {
  plan: MealPlan
  activeRecipeId: string
  stepByRecipe: Record<string, number>
  completedRecipeIds: string[]
  timers: CookingTimerState[]
  updatedAt: number
}
