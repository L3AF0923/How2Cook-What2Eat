import generated from './generated-recipes.json'
import { recipes as curated } from './recipes'
import type { Recipe } from '../types'

const curatedNames = new Set(curated.map((recipe) => recipe.name))

export const builtInRecipes: Recipe[] = [
  ...curated,
  ...(generated as Recipe[]).filter((recipe) => !curatedNames.has(recipe.name))
]
