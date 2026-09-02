import { Check, ChevronLeft, ChevronRight, ChefHat, Clock3, LogOut, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CookingProgress, CookingTimerState } from '../types'
import { createCookingTimer, normalizeTimers, parseExplicitDurations, pauseCookingTimer, removeCookingTimer, resetCookingTimer, resumeCookingTimer, timerRemainingMs } from '../lib/cooking'
import CookingTimer from './CookingTimer'

interface CookingModeProps {
  progress: CookingProgress
  onChange: (progress: CookingProgress) => void
  onExit: () => void
}

export default function CookingMode({ progress, onChange, onExit }: CookingModeProps) {
  const [now, setNow] = useState(Date.now())
  const [timerNotice, setTimerNotice] = useState('')
  const activeDish = progress.plan.dishes.find(({ recipe }) => recipe.id === progress.activeRecipeId) ?? progress.plan.dishes[0]
  const recipe = activeDish?.recipe
  const stepIndex = recipe ? Math.min(progress.stepByRecipe[recipe.id] ?? 0, Math.max(0, recipe.steps.length - 1)) : 0
  const step = recipe?.steps[stepIndex] ?? '这道菜暂时没有可用步骤。'
  const durations = useMemo(() => parseExplicitDurations(step), [step])
  const allComplete = progress.plan.dishes.length > 0 && progress.plan.dishes.every(({ recipe: item }) => progress.completedRecipeIds.includes(item.id))

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const normalized = normalizeTimers(progress.timers, now)
    const newlyFinished = normalized.filter((timer, index) => timer.status === 'finished' && progress.timers[index]?.status === 'running')
    if (newlyFinished.length) {
      const names = newlyFinished.map((timer) => progress.plan.dishes.find(({ recipe: item }) => item.id === timer.recipeId)?.recipe.name).filter(Boolean)
      setTimerNotice(`${names.join('、') || '当前步骤'}计时结束`)
      window.setTimeout(() => setTimerNotice(''), 3000)
      onChange({ ...progress, timers: normalized, updatedAt: now })
    }
  }, [now, onChange, progress])

  const update = (changes: Partial<CookingProgress>) => onChange({ ...progress, ...changes, updatedAt: Date.now() })
  const updateTimer = (id: string, mapper: (timer: CookingTimerState) => CookingTimerState) => update({ timers: progress.timers.map((timer) => timer.id === id ? mapper(timer) : timer) })
  const selectRecipe = (recipeId: string, targetStep?: number) => update({ activeRecipeId: recipeId, stepByRecipe: targetStep === undefined ? progress.stepByRecipe : { ...progress.stepByRecipe, [recipeId]: targetStep } })
  const startTimer = (durationIndex: number) => {
    if (!recipe) return
    const duration = durations[durationIndex]
    const existing = progress.timers.find((timer) => timer.recipeId === recipe.id && timer.stepIndex === stepIndex && timer.durationMs === duration.durationMs && timer.status !== 'finished')
    if (existing) return
    update({ timers: [...progress.timers, createCookingTimer(recipe.id, stepIndex, duration, Date.now(), progress.timers.length)] })
  }
  const finishRecipe = () => {
    if (!recipe) return
    const completedRecipeIds = [...new Set([...progress.completedRecipeIds, recipe.id])]
    const next = progress.plan.dishes.find(({ recipe: item }) => !completedRecipeIds.includes(item.id))
    update({ completedRecipeIds, activeRecipeId: next?.recipe.id ?? recipe.id })
  }

  if (!recipe) return <main className="cooking-mode"><div className="cooking-empty"><h1>没有可烹饪的菜品</h1><button onClick={onExit}>返回菜单</button></div></main>

  if (allComplete) return <main className="cooking-mode cooking-finished"><div><ChefHat /><span>全部完成</span><h1>开饭啦</h1><p>{progress.plan.dishes.length} 道菜都已经做好，趁热开动吧。</p><button onClick={onExit}>返回菜单</button></div></main>

  const currentTimers = progress.timers.filter((timer) => timer.recipeId === recipe.id && timer.stepIndex === stepIndex)
  const activeTimers = progress.timers.filter((timer) => timer.status !== 'finished')
  const moveStep = (delta: number) => update({ stepByRecipe: { ...progress.stepByRecipe, [recipe.id]: Math.max(0, Math.min(recipe.steps.length - 1, stepIndex + delta)) } })

  return <main className="cooking-mode">
    <header className="cooking-header"><div><span className="eyebrow">做饭模式</span><strong>{progress.plan.title}</strong></div><button onClick={onExit}><LogOut />退出做饭模式</button></header>
    {timerNotice && <div className="timer-toast" role="status" aria-live="assertive"><Clock3 />{timerNotice}</div>}
    <div className="cooking-layout">
      <aside className="cooking-dishes" aria-label="本桌菜单"><span>本桌菜单</span>{progress.plan.dishes.map(({ recipe: item }, index) => {
        const completed = progress.completedRecipeIds.includes(item.id)
        return <button key={item.id} className={item.id === recipe.id ? 'active' : ''} onClick={() => selectRecipe(item.id)} aria-current={item.id === recipe.id ? 'step' : undefined}><i>{completed ? <Check /> : index + 1}</i><span>{item.name}<small>{completed ? '已完成' : `步骤 ${(progress.stepByRecipe[item.id] ?? 0) + 1} / ${item.steps.length}`}</small></span></button>
      })}</aside>
      <section className="cooking-workspace">
        <div className="cooking-step-heading"><span>当前正在做</span><h1>{recipe.name}</h1><p>步骤 {stepIndex + 1} / {recipe.steps.length}</p></div>
        <div className="cooking-step-text">{step}</div>
        {durations.length > 0 && <div className="quick-timers"><span>当前步骤预计时间</span>{durations.map((duration, index) => <button key={`${duration.label}-${index}`} onClick={() => startTimer(index)}><Play />开始 {duration.label}计时</button>)}</div>}
        {currentTimers.length > 0 && <div className="current-timers">{currentTimers.map((timer) => <CookingTimer key={timer.id} timer={timer} now={now} onPause={() => updateTimer(timer.id, (item) => pauseCookingTimer(item))} onResume={() => updateTimer(timer.id, (item) => resumeCookingTimer(item))} onReset={() => updateTimer(timer.id, resetCookingTimer)} onRemove={() => update({ timers: removeCookingTimer(progress.timers, timer.id) })} />)}</div>}
        <div className="step-navigation"><button onClick={() => moveStep(-1)} disabled={stepIndex === 0}><ChevronLeft />上一步</button>{stepIndex === recipe.steps.length - 1 ? <button className="primary" onClick={finishRecipe}><Check />完成这道菜</button> : <button className="primary" onClick={() => moveStep(1)}>下一步<ChevronRight /></button>}</div>
      </section>
      {activeTimers.length > 0 && <aside className="active-timers"><span>正在计时</span>{activeTimers.map((timer) => {
        const dish = progress.plan.dishes.find(({ recipe: item }) => item.id === timer.recipeId)?.recipe
        return <button key={timer.id} onClick={() => selectRecipe(timer.recipeId, timer.stepIndex)}><span>{dish?.name ?? '菜品'}<small>{timer.status === 'paused' ? '已暂停' : timer.label}</small></span><strong>{formatShort(timerRemainingMs(timer, now))}</strong></button>
      })}</aside>}
    </div>
  </main>
}

function formatShort(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}
