import type { CookingProgress, CookingTimerState, MealPlan } from '../types'

export interface ParsedDuration {
  label: string
  durationMs: number
}

const TIME_PATTERN = /(?<![\d.-])(\d+(?:\.\d+)?)\s*(秒钟?|分钟?|小时)/g

export function parseExplicitDurations(text: string): ParsedDuration[] {
  const matches: ParsedDuration[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(TIME_PATTERN)) {
    const value = Number(match[1])
    const unit = match[2]
    const durationMs = value * (unit.startsWith('小时') ? 3_600_000 : unit.startsWith('分') ? 60_000 : 1_000)
    const label = `${match[1]} ${unit.startsWith('小时') ? '小时' : unit.startsWith('分') ? '分钟' : '秒'}`
    const key = `${label}:${durationMs}`
    if (value > 0 && !seen.has(key)) {
      matches.push({ label, durationMs })
      seen.add(key)
    }
  }
  return matches
}

export function createCookingProgress(plan: MealPlan, now = Date.now()): CookingProgress {
  const firstRecipeId = plan.dishes[0]?.recipe.id ?? ''
  return {
    plan,
    activeRecipeId: firstRecipeId,
    stepByRecipe: Object.fromEntries(plan.dishes.map(({ recipe }) => [recipe.id, 0])),
    completedRecipeIds: [],
    timers: [],
    updatedAt: now
  }
}

export function timerRemainingMs(timer: CookingTimerState, now = Date.now()): number {
  if (timer.status === 'finished') return 0
  if (timer.status === 'running' && timer.targetEndAt !== null) return Math.max(0, timer.targetEndAt - now)
  return Math.max(0, timer.remainingMs)
}

export function normalizeTimers(timers: CookingTimerState[], now = Date.now()): CookingTimerState[] {
  return timers.map((timer) => timer.status === 'running' && timerRemainingMs(timer, now) === 0
    ? { ...timer, status: 'finished', targetEndAt: null, remainingMs: 0 }
    : timer)
}

export function createCookingTimer(recipeId: string, stepIndex: number, duration: ParsedDuration, now = Date.now(), nonce = 0): CookingTimerState {
  return {
    id: `${recipeId}:${stepIndex}:${duration.durationMs}:${now}:${nonce}`,
    recipeId,
    stepIndex,
    label: duration.label,
    durationMs: duration.durationMs,
    status: 'running',
    targetEndAt: now + duration.durationMs,
    remainingMs: duration.durationMs
  }
}

export function pauseCookingTimer(timer: CookingTimerState, now = Date.now()): CookingTimerState {
  if (timer.status !== 'running') return timer
  return { ...timer, status: 'paused', targetEndAt: null, remainingMs: timerRemainingMs(timer, now) }
}

export function resumeCookingTimer(timer: CookingTimerState, now = Date.now()): CookingTimerState {
  if (timer.status !== 'paused' || timer.remainingMs <= 0) return timer
  return { ...timer, status: 'running', targetEndAt: now + timer.remainingMs }
}

export function resetCookingTimer(timer: CookingTimerState): CookingTimerState {
  return { ...timer, status: 'paused', targetEndAt: null, remainingMs: timer.durationMs }
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
