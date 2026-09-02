import { describe, expect, it } from 'vitest'
import { createCookingProgress, createCookingTimer, formatCountdown, normalizeTimers, parseExplicitDurations, pauseCookingTimer, removeCookingTimer, resetCookingTimer, resumeCookingTimer, timerRemainingMs } from './cooking'
import { dishProfile } from './recommender'
import { recipes } from '../data/recipes'
import type { MealPlan } from '../types'

const colaWings = recipes.find((recipe) => recipe.id === 'cola-wings')!
const tomatoEggs = recipes.find((recipe) => recipe.id === 'tomato-eggs')!
const plan: MealPlan = {
  id: 'cooking-test', title: '做饭测试', summary: '', estimatedMinutes: 30, reasons: [], cookingOrder: [],
  dishes: [colaWings, tomatoEggs].map((recipe) => ({ recipe, score: 1, reasons: [], ...dishProfile(recipe) }))
}

describe('explicit Chinese duration parser', () => {
  it('recognizes seconds, minutes and hours', () => {
    expect(parseExplicitDurations('煮 30 秒，焖 10 分钟，再静置 1 小时')).toEqual([
      { label: '30 秒', durationMs: 30_000 },
      { label: '10 分钟', durationMs: 600_000 },
      { label: '1 小时', durationMs: 3_600_000 }
    ])
  })
  it('does not infer vague cooking descriptions', () => {
    expect(parseExplicitDurations('稍微焖一下，炒至断生后煮至熟透')).toEqual([])
  })
  it('does not choose one endpoint from a time range', () => {
    expect(parseExplicitDurations('继续翻炒 2-3 分钟，视火力调整')).toEqual([])
  })
})

describe('cooking progress and timers', () => {
  it('initializes every dish at step one without changing the meal plan', () => {
    const progress = createCookingProgress(plan, 100)
    expect(progress.plan).toBe(plan)
    expect(progress.activeRecipeId).toBe(colaWings.id)
    expect(progress.stepByRecipe).toEqual({ [colaWings.id]: 0, [tomatoEggs.id]: 0 })
    expect(progress.completedRecipeIds).toEqual([])
  })
  it('uses a target timestamp so background time remains accurate', () => {
    const timer = createCookingTimer(colaWings.id, 2, { label: '10 分钟', durationMs: 600_000 }, 1_000)
    expect(timerRemainingMs(timer, 121_000)).toBe(480_000)
    expect(timerRemainingMs(timer, 601_000)).toBe(0)
    expect(normalizeTimers([timer], 601_000)[0].status).toBe('finished')
  })
  it('pauses, resumes and resets from real remaining time', () => {
    const timer = createCookingTimer(colaWings.id, 2, { label: '10 分钟', durationMs: 600_000 }, 1_000)
    const paused = pauseCookingTimer(timer, 101_000)
    expect(paused).toMatchObject({ status: 'paused', targetEndAt: null, remainingMs: 500_000 })
    const resumed = resumeCookingTimer(paused, 201_000)
    expect(resumed).toMatchObject({ status: 'running', targetEndAt: 701_000 })
    expect(resetCookingTimer(resumed)).toMatchObject({ status: 'paused', targetEndAt: null, remainingMs: 600_000 })
  })
  it('keeps multiple recipe timers independent', () => {
    const first = createCookingTimer(colaWings.id, 2, { label: '10 分钟', durationMs: 600_000 }, 0, 0)
    const second = createCookingTimer(tomatoEggs.id, 1, { label: '2 分钟', durationMs: 120_000 }, 30_000, 1)
    expect(timerRemainingMs(first, 60_000)).toBe(540_000)
    expect(timerRemainingMs(second, 60_000)).toBe(90_000)
    expect(pauseCookingTimer(first, 60_000).status).toBe('paused')
    expect(second.status).toBe('running')
  })
  it('removes only the selected timer', () => {
    const first = createCookingTimer(colaWings.id, 2, { label: '10 分钟', durationMs: 600_000 }, 0, 0)
    const second = createCookingTimer(tomatoEggs.id, 1, { label: '2 分钟', durationMs: 120_000 }, 0, 1)
    expect(removeCookingTimer([first, second], first.id)).toEqual([second])
  })
  it('formats short and hour-long countdowns', () => {
    expect(formatCountdown(599_001)).toBe('10:00')
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
  })
})
