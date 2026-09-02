import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Bookmark, BookmarkCheck, Check, ChefHat, ChevronDown, ClipboardCopy, Clock3, ExternalLink, Flame, Heart, History, Minus, Play, Plus, RotateCcw, Search, Settings, ShoppingBasket, Sparkles, Users, X } from 'lucide-react'
import type { CookingProgress, Difficulty, Meal, MealPlan, Preferences, Recipe, Recommendation } from './types'
import { defaultPreferences, findRecipeSearchMatch, formatIngredientAmount, generateMealPlans, parseQuery, recipeSearchConflict, replaceDishInMealPlan } from './lib/recommender'
import { buildShoppingList, shoppingListToText } from './lib/shopping'
import { builtInRecipes } from './data/all-recipes'
import RecipeAdmin from './components/RecipeAdmin'
import CookingMode from './components/CookingMode'
import { createCookingProgress } from './lib/cooking'

const starters = ['一人份快速午餐', '两个人的清淡晚餐', '用鸡蛋和西红柿做饭', '新手也能做的早餐']
const storage = {
  get<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } },
  set(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)) }
}
const loadPreferences = (): Preferences => ({ ...defaultPreferences, ...storage.get<Partial<Preferences>>('wtet.preferences', {}) })

async function copyPlainText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function Filters({ value, onChange }: { value: Preferences; onChange: (next: Preferences) => void }) {
  const set = <K extends keyof Preferences>(key: K, next: Preferences[K]) => onChange({ ...value, [key]: next })
  const mealOptions: Meal[] = ['不限', '早餐', '午餐', '晚餐']
  const difficultyOptions: Array<Difficulty | '不限'> = ['不限', '新手', '普通']
  const autoStructure = value.people <= 1 ? { meatCount: 0, vegetableCount: 1, soupCount: 0, stapleCount: 1 } : value.people === 2 ? { meatCount: 1, vegetableCount: 1, soupCount: 0, stapleCount: 1 } : value.people <= 4 ? { meatCount: 2, vegetableCount: 2, soupCount: 1, stapleCount: 0 } : value.people <= 6 ? { meatCount: 3, vegetableCount: 2, soupCount: 1, stapleCount: 0 } : value.people <= 8 ? { meatCount: 4, vegetableCount: 2, soupCount: 1, stapleCount: 0 } : { meatCount: 4, vegetableCount: 3, soupCount: 1, stapleCount: 1 }
  const shownStructure = value.menuMode === 'custom' ? value : { ...value, ...autoStructure }
  const adjustStructure = (key: 'meatCount' | 'vegetableCount' | 'soupCount' | 'stapleCount', delta: number) => onChange({ ...value, ...shownStructure, menuMode: 'custom', [key]: Math.max(0, Math.min(12, shownStructure[key] + delta)) })
  return <aside className="filters">
    <div className="filter-heading"><div><span className="eyebrow">偏好设置</span><h2>这顿饭，按你想的来</h2></div><button className="icon-button" onClick={() => onChange(defaultPreferences)} title="重置"><RotateCcw size={17} /></button></div>
    <label className="field-label"><span><Users size={16} /> 用餐人数</span><span className="stepper"><button onClick={() => set('people', Math.max(1, value.people - 1))}><Minus /></button><b>{value.people} 人</b><button onClick={() => set('people', Math.min(10, value.people + 1))}><Plus /></button></span></label>
    <div className="field"><span className="field-title">餐次</span><div className="segments">{mealOptions.map((x) => <button className={value.meal === x ? 'active' : ''} onClick={() => set('meal', x)} key={x}>{x}</button>)}</div></div>
    <div className="field"><span className="field-title"><Clock3 size={16} /> 最长用时 <b>{value.maxMinutes} 分钟</b></span><input type="range" min="10" max="90" step="5" value={value.maxMinutes} onChange={(e) => set('maxMinutes', Number(e.target.value))} /></div>
    <div className="field"><span className="field-title">烹饪难度</span><div className="segments">{difficultyOptions.map((x) => <button className={value.difficulty === x ? 'active' : ''} onClick={() => set('difficulty', x)} key={x}>{x}</button>)}</div></div>
    <div className="field menu-structure"><div className="structure-title"><span className="field-title">菜单结构</span><button className={value.menuMode === 'auto' ? 'active' : ''} onClick={() => onChange({ ...value, menuMode: 'auto' })}>{value.menuMode === 'auto' ? '按人数智能搭配' : '恢复智能搭配'}</button></div>{([['meatCount', '荤菜'], ['vegetableCount', '素菜'], ['soupCount', '汤品'], ['stapleCount', '主食']] as const).map(([key, label]) => <div className="structure-row" key={key}><span>{label}</span><span className="stepper"><button onClick={() => adjustStructure(key, -1)}><Minus /></button><b>{shownStructure[key]}</b><button onClick={() => adjustStructure(key, 1)}><Plus /></button></span></div>)}</div>
    <div className="check-row"><button className={value.noSpicy ? 'check active' : 'check'} onClick={() => set('noSpicy', !value.noSpicy)}><Flame size={16} /> 不吃辣</button><button className={value.vegetarian ? 'check active' : 'check'} onClick={() => set('vegetarian', !value.vegetarian)}><Heart size={16} /> 素食</button></div>
    <TagInput label="过敏原（严格排除）" placeholder="例如：虾、鸡蛋" values={value.allergies} onChange={(x) => set('allergies', x)} />
    <TagInput label="冰箱里有什么" placeholder="例如：番茄、面条" values={value.pantry} onChange={(x) => set('pantry', x)} />
    <p className="safety">过敏信息仅用于菜谱初筛，请同时核对食品包装和配料表。</p>
  </aside>
}

function TagInput({ label, placeholder, values, onChange }: { label: string; placeholder: string; values: string[]; onChange: (x: string[]) => void }) {
  const [text, setText] = useState('')
  const add = () => { const items = text.split(/[、，,\s]+/).filter(Boolean); if (items.length) onChange([...new Set([...values, ...items])]); setText('') }
  return <div className="field tag-field"><span className="field-title">{label}</span><div className="tag-input"><input value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} /><button onClick={add}><Plus size={16} /></button></div><div className="tags">{values.map((x) => <span key={x}>{x}<button onClick={() => onChange(values.filter((v) => v !== x))}><X size={12} /></button></span>)}</div></div>
}

function RecipeCard({ item, people, favorite, onFavorite, onOpen, compact = false }: { item: Recommendation; people: number; favorite: boolean; onFavorite: () => void; onOpen: () => void; compact?: boolean }) {
  const { recipe } = item
  return <article className={compact ? 'recipe-card compact' : 'recipe-card'}>
    <div className="recipe-top"><div className="recipe-category">{recipe.category}</div><button className="favorite" onClick={onFavorite} title="收藏">{favorite ? <BookmarkCheck /> : <Bookmark />}</button></div>
    <div><h3>{recipe.name}</h3><p>{recipe.description}</p></div>
    <div className="meta"><span><Clock3 /> {recipe.minutes} 分钟</span><span><ChefHat /> {recipe.difficulty}</span><span><Users /> {people} 人份</span></div>
    {!compact && <><div className="reason">{item.reasons.length ? item.reasons.join(' · ') : '今天就吃点好做又好吃的'}</div><div className="ingredient-preview"><span>你需要</span><p>{recipe.ingredients.slice(0, 4).map((x) => x.name).join('、')}{recipe.ingredients.length > 4 ? '…' : ''}</p></div></>}
    <button className="detail-button" onClick={onOpen}>查看完整做法 <ArrowRight size={17} /></button>
  </article>
}

function RecipeModal({ recipe, people, onClose }: { recipe: Recipe; people: number; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal">
    <button className="modal-close" onClick={onClose}><X /></button>
    <div className="modal-hero"><span className="eyebrow">{recipe.category} · {recipe.difficulty}</span><h2>{recipe.name}</h2><p>{recipe.description}</p><div className="meta"><span><Clock3 /> {recipe.minutes} 分钟</span><span><Users /> {people} 人份</span>{recipe.calories && <span><Flame /> 约 {Math.round(recipe.calories * people / recipe.servings)} 千卡</span>}</div></div>
    <section><div className="section-title"><ShoppingBasket /><div><span>准备好这些</span><h3>食材清单</h3></div></div><div className="ingredient-list">{recipe.ingredients.map((x) => <div key={x.name}><span>{x.name}{x.optional && <em>可选</em>}</span><b>{formatIngredientAmount(x, recipe.servings, people)}</b></div>)}</div><p className="scale-note">明确的单一用量会按 {people} 人份换算；区间、适量及原菜谱备注保留 HowToCook 原始写法。</p></section>
    <section><div className="section-title"><ChefHat /><div><span>跟着步骤来</span><h3>开始烹饪</h3></div></div><ol className="steps">{recipe.steps.map((x, i) => <li key={x}><b>{String(i + 1).padStart(2, '0')}</b><p>{x}</p></li>)}</ol></section>
    <section className="tips"><h3>下厨提示</h3>{recipe.tips.map((x) => <p key={x}>— {x}</p>)}</section>
    <a className="source" href={recipe.source} target="_blank" rel="noreferrer">查看 HowToCook 原始菜谱 <ExternalLink size={15} /></a>
  </div></div>
}

function PlanCard({ plan, people, favorites, replacingKey, cookingProgress, onFavorite, onRecipe, onReplace, onPlan, onCook, compact = false }: { plan: MealPlan; people: number; favorites: string[]; replacingKey: string | null; cookingProgress: CookingProgress | null; onFavorite: (id: string) => void; onRecipe: (recipe: Recipe) => void; onReplace: (plan: MealPlan, recipeId: string) => void; onPlan: () => void; onCook: () => void; compact?: boolean }) {
  const canContinue = cookingProgress?.plan.id === plan.id && cookingProgress.completedRecipeIds.length < plan.dishes.length
  return <article className={compact ? 'plan-card compact' : 'plan-card'}>
    <div className="plan-head"><div><span className="eyebrow">{compact ? '另一桌选择' : '今日整桌推荐'}</span><h3>{plan.title}</h3></div><span className="plan-time"><Clock3 /> 约 {plan.estimatedMinutes} 分钟</span></div>
    <p className="plan-summary">{plan.summary}</p>
    {!compact && <div className="balance-notes">{plan.reasons.map((x) => <span key={x}><Sparkles />{x}</span>)}</div>}
    <div className="dish-list">{plan.dishes.map((dish) => { const replacing = replacingKey === `${plan.id}:${dish.recipe.id}`; return <div className={replacing ? 'dish-row replacing' : 'dish-row'} key={dish.recipe.id}>
      <button className="dish-main" onClick={() => onRecipe(dish.recipe)}><span className={`role role-${dish.role}`}>{dish.role}</span><span><b>{dish.recipe.name}</b><small>{dish.protein} · {dish.method} · {dish.recipe.minutes} 分钟</small></span></button>
      <div className="dish-actions"><button className="replace-dish" onClick={() => onReplace(plan, dish.recipe.id)} disabled={replacing} aria-label={`更换${dish.recipe.name}`} title="换一道"><RotateCcw /> <span>{replacing ? '更换中' : '换一道'}</span></button><button className="favorite" onClick={() => onFavorite(dish.recipe.id)} title="收藏">{favorites.includes(dish.recipe.id) ? <BookmarkCheck /> : <Bookmark />}</button></div>
    </div> })}</div>
    <div className="plan-footer-actions"><button className="start-cooking" onClick={onCook}><Play />{canContinue ? '继续做饭' : '开始做饭'}</button><button className="plan-detail" onClick={onPlan}><ShoppingBasket /> 查看食材清单与下厨顺序 <ArrowRight /></button></div>
  </article>
}

function PlanModal({ plan, people, onRecipe, onClose }: { plan: MealPlan; people: number; onRecipe: (recipe: Recipe) => void; onClose: () => void }) {
  const shopping = useMemo(() => buildShoppingList(plan, people), [plan, people])
  const storageKey = `wtet.shopping.${plan.id}`
  const [purchased, setPurchased] = useState<string[]>(() => storage.get(storageKey, []))
  const [copyFeedback, setCopyFeedback] = useState('')
  const purchasedSet = useMemo(() => new Set(purchased), [purchased])
  useEffect(() => storage.set(storageKey, purchased), [storageKey, purchased])
  const togglePurchased = (id: string) => setPurchased((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const copyShoppingList = async () => {
    const text = shoppingListToText(shopping, purchasedSet)
    if (!text) {
      setCopyFeedback('已全部购买')
      window.setTimeout(() => setCopyFeedback(''), 1800)
      return
    }
    try {
      await copyPlainText(text)
      setCopyFeedback('已复制')
    } catch {
      setCopyFeedback('复制失败')
    }
    window.setTimeout(() => setCopyFeedback(''), 1800)
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal plan-modal">
    <button className="modal-close" onClick={onClose}><X /></button>
    <div className="modal-hero"><span className="eyebrow">整套餐单</span><h2>{plan.title}</h2><p>{plan.summary}</p><div className="meta"><span><Clock3 /> 约 {plan.estimatedMinutes} 分钟</span><span><Users /> {people} 人</span><span><ChefHat /> {plan.dishes.length} 个菜品</span></div></div>
    <section><div className="shopping-heading"><div className="section-title"><ShoppingBasket /><div><span>本桌所需</span><h3>食材清单</h3></div></div><button className="copy-shopping" onClick={copyShoppingList}>{copyFeedback === '已复制' ? <Check /> : <ClipboardCopy />} {copyFeedback || '复制购物清单'}</button></div><div className="shopping-list">{shopping.map((item) => <label className={purchasedSet.has(item.id) ? 'shopping-item purchased' : 'shopping-item'} key={item.id}><input type="checkbox" checked={purchasedSet.has(item.id)} onChange={() => togglePurchased(item.id)} /><span>{item.name}{item.optional && <em>可选</em>}</span><b>{item.amount}</b></label>)}</div><span className="copy-status" role="status" aria-live="polite">{copyFeedback}</span><p className="scale-note">同单位的明确用量已合并；区间、适量及备注保留原菜谱写法。勾选已购买的食材后，复制时会自动忽略它们。</p></section>
    <section><div className="section-title"><Clock3 /><div><span>少忙乱，更快上桌</span><h3>建议下厨顺序</h3></div></div><ol className="steps">{plan.cookingOrder.map((x, i) => <li key={x}><b>{String(i + 1).padStart(2, '0')}</b><p>{x}</p></li>)}</ol></section>
    <section><div className="section-title"><ChefHat /><div><span>逐道查看</span><h3>本桌菜单</h3></div></div><div className="modal-dishes">{plan.dishes.map((dish) => <button key={dish.recipe.id} onClick={() => onRecipe(dish.recipe)}><span className={`role role-${dish.role}`}>{dish.role}</span><b>{dish.recipe.name}</b><ArrowRight /></button>)}</div></section>
  </div></div>
}

export default function App() {
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, Recipe>>(() => storage.get('wtet.recipe-overrides', {}))
  const [deletedRecipes, setDeletedRecipes] = useState<string[]>(() => storage.get('wtet.deleted-recipes', []))
  const catalog = useMemo(() => {
    const builtInIds = new Set(builtInRecipes.map((recipe) => recipe.id))
    return [...builtInRecipes.filter((recipe) => !deletedRecipes.includes(recipe.id)).map((recipe) => recipeOverrides[recipe.id] || recipe), ...Object.values(recipeOverrides).filter((recipe) => !builtInIds.has(recipe.id) && !deletedRecipes.includes(recipe.id))]
  }, [recipeOverrides, deletedRecipes])
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [query, setQuery] = useState('')
  const [lastQuery, setLastQuery] = useState('今天吃什么？')
  const [results, setResults] = useState<MealPlan[]>(() => generateMealPlans(loadPreferences(), storage.get('wtet.recent-recipes', []), 1, builtInRecipes))
  const [recentRecipes, setRecentRecipes] = useState<string[]>(() => storage.get('wtet.recent-recipes', []))
  const [favorites, setFavorites] = useState<string[]>(() => storage.get('wtet.favorites', []))
  const [history, setHistory] = useState<string[]>(() => storage.get('wtet.history', []))
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [replacingKey, setReplacingKey] = useState<string | null>(null)
  const [searchTarget, setSearchTarget] = useState<Recipe | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [resultPulse, setResultPulse] = useState(false)
  const [cookingProgress, setCookingProgress] = useState<CookingProgress | null>(() => storage.get<CookingProgress | null>('wtet.cooking-progress', null))
  const [cookingOpen, setCookingOpen] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const replacementTimer = useRef<number | null>(null)
  const feedbackTimer = useRef<number | null>(null)

  useEffect(() => storage.set('wtet.preferences', preferences), [preferences])
  useEffect(() => storage.set('wtet.favorites', favorites), [favorites])
  useEffect(() => storage.set('wtet.history', history), [history])
  useEffect(() => storage.set('wtet.recent-recipes', recentRecipes), [recentRecipes])
  useEffect(() => storage.set('wtet.recipe-overrides', recipeOverrides), [recipeOverrides])
  useEffect(() => storage.set('wtet.deleted-recipes', deletedRecipes), [deletedRecipes])
  useEffect(() => { if (cookingProgress) storage.set('wtet.cooking-progress', cookingProgress) }, [cookingProgress])
  useEffect(() => {
    const closeHistory = (event: PointerEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) setHistoryOpen(false)
    }
    const closeHistoryOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHistoryOpen(false)
    }
    document.addEventListener('pointerdown', closeHistory)
    document.addEventListener('keydown', closeHistoryOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeHistory)
      document.removeEventListener('keydown', closeHistoryOnEscape)
    }
  }, [])
  useEffect(() => () => {
    if (replacementTimer.current !== null) window.clearTimeout(replacementTimer.current)
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => setResults(generateMealPlans(preferences, recentRecipes, 1, catalog, searchTarget ?? undefined)), 180)
    return () => window.clearTimeout(timer)
  }, [preferences, catalog, searchTarget])
  const favoriteResults = useMemo(() => favorites.map((id) => catalog.find((recipe) => recipe.id === id)).filter(Boolean).map((recipe) => ({ recipe: recipe!, score: 100, reasons: [] })), [favorites, catalog])
  const toggleFavorite = (id: string) => setFavorites((x) => x.includes(id) ? x.filter((v) => v !== id) : [...x, id])

  const revealResults = () => {
    setIsSearching(true)
    setResultPulse(false)
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
      setResultPulse(true)
    }))
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => { setIsSearching(false); setResultPulse(false) }, 900)
  }

  const ask = (text = query) => {
    const cleaned = text.trim()
    if (!cleaned) {
      const plans = generateMealPlans(preferences, recentRecipes, 1, catalog)
      setSearchTarget(null)
      setResults(plans); setLastQuery(`按当前偏好推荐 · ${preferences.people} 人${preferences.meal === '不限' ? '' : preferences.meal}`)
      setRecentRecipes((old) => [...plans[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20))
      revealResults()
      return
    }
    const parsed = parseQuery(cleaned, preferences)
    const match = findRecipeSearchMatch(cleaned, catalog)
    const conflict = match ? recipeSearchConflict(match.recipe, parsed) : null
    const target = match && !conflict ? match.recipe : null
    const plans = generateMealPlans(parsed, recentRecipes, 1, catalog, target ?? undefined)
    setPreferences(parsed); setLastQuery(cleaned); setQuery('')
    setSearchTarget(target)
    if (conflict) setLastQuery(`${conflict}，已为你推荐安全选择`)
    else if (target) setLastQuery(parsed.people > 1 ? `以「${target.name}」为主的一桌` : `找到「${target.name}」`)
    setResults(plans); setRecentRecipes((old) => [...plans[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20)); setHistory((x) => [cleaned, ...x.filter((v) => v !== cleaned)].slice(0, 8))
    revealResults()
  }
  const reroll = () => {
    const currentIds = results.flatMap((plan) => plan.dishes.map((x) => x.recipe.id))
    const recentWithoutTarget = searchTarget ? currentIds.filter((id) => id !== searchTarget.id) : currentIds
    const next = generateMealPlans(preferences, [...recentWithoutTarget, ...recentRecipes], 1, catalog, searchTarget ?? undefined)
    setResults(next); setRecentRecipes((old) => [...next[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20))
    revealResults()
  }
  const replaceDish = (plan: MealPlan, recipeId: string) => {
    const key = `${plan.id}:${recipeId}`
    setReplacingKey(key)
    if (replacementTimer.current !== null) window.clearTimeout(replacementTimer.current)
    replacementTimer.current = window.setTimeout(() => {
      const nextPlan = replaceDishInMealPlan(plan, recipeId, preferences, recentRecipes, catalog)
      setResults((current) => current.map((item) => item === plan ? nextPlan : item))
      if (nextPlan !== plan) {
        const nextId = nextPlan.dishes.find((dish) => !plan.dishes.some((oldDish) => oldDish.recipe.id === dish.recipe.id))?.recipe.id
        if (nextId) setRecentRecipes((current) => [nextId, recipeId, ...current].slice(0, 20))
      }
      setReplacingKey(null)
      replacementTimer.current = null
    }, 220)
  }

  const openCooking = (plan: MealPlan) => {
    setCookingProgress((current) => current?.plan.id === plan.id && current.completedRecipeIds.length < current.plan.dishes.length ? current : createCookingProgress(plan))
    setSelectedPlan(null)
    setSelected(null)
    setCookingOpen(true)
  }

  if (cookingOpen && cookingProgress) return <CookingMode progress={cookingProgress} onChange={setCookingProgress} onExit={() => setCookingOpen(false)} />

  return <div className="app-shell">
    <header><a className="brand" href="#"><span><ChefHat /></span><div><b>今天吃什么</b><small>认真解决每一顿</small></div></a><nav>{cookingProgress && cookingProgress.completedRecipeIds.length < cookingProgress.plan.dishes.length && <button className="cooking-resume" onClick={() => setCookingOpen(true)}><Play size={18} /> 继续做饭</button>}<button onClick={() => setAdminOpen(true)}><Settings size={18} /> 管理</button><button onClick={() => setShowSaved(!showSaved)} className={showSaved ? 'active' : ''}><Bookmark size={18} /> 收藏 <i>{favorites.length}</i></button><div className={historyOpen ? 'history-menu open' : 'history-menu'} ref={historyRef}><button className="history-button" onClick={() => setHistoryOpen((open) => !open)} aria-expanded={historyOpen} aria-controls="history-popover" aria-haspopup="menu"><History size={18} /> 历史</button><div className="history-popover" id="history-popover" role="menu">{history.length ? history.map((x) => <button role="menuitem" key={x} onClick={() => { setQuery(x); ask(x); setHistoryOpen(false) }}>{x}</button>) : <em>还没有搜索记录</em>}</div></div></nav></header>
    <main>
      <button className="mobile-filter" onClick={() => setFiltersOpen(!filtersOpen)}>调整用餐偏好 <ChevronDown /></button>
      <div className={filtersOpen ? 'filter-wrap open' : 'filter-wrap'}><Filters value={preferences} onChange={setPreferences} /></div>
      <section className="content">
        {showSaved ? <div className="saved-view"><span className="eyebrow">我的收藏</span><h1>留住想吃的味道</h1>{favoriteResults.length ? <div className="card-grid">{favoriteResults.map((item) => <RecipeCard key={item.recipe.id} item={item} people={preferences.people} favorite onFavorite={() => toggleFavorite(item.recipe.id)} onOpen={() => setSelected(item.recipe)} compact />)}</div> : <div className="empty"><Bookmark /><h3>还没有收藏</h3><p>遇到喜欢的菜谱，点一下书签就能留在这里。</p></div>}</div> : <>
          <div className="hero"><span className="eyebrow"><Sparkles size={14} /> 今日灵感</span><h1>今天，想吃点<br/><em>什么好的？</em></h1><p>告诉我人数、时间或手边食材，剩下的交给我。</p></div>
          <div className="ask-box"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ask() } }} placeholder="例如：糖醋排骨，或两个人的清淡晚餐" /><button onClick={() => ask()} disabled={isSearching}>{isSearching ? '正在推荐…' : '帮我想想'} {!isSearching && <ArrowRight />}</button></div>
          <div className="starters">{starters.map((x) => <button key={x} onClick={() => ask(x)}>{x}</button>)}</div>
          <div ref={resultRef} className={resultPulse ? 'result-area result-feedback' : 'result-area'}><div className="result-heading"><div><span className="eyebrow">为你推荐</span><h2>{lastQuery}</h2></div><button className="reroll" onClick={reroll}><RotateCcw /> 换一换</button></div>
          {results.length ? <div className="plan-results"><PlanCard plan={results[0]} people={preferences.people} favorites={favorites} replacingKey={replacingKey} cookingProgress={cookingProgress} onFavorite={toggleFavorite} onRecipe={setSelected} onReplace={replaceDish} onPlan={() => setSelectedPlan(results[0])} onCook={() => openCooking(results[0])} /></div> : <div className="empty"><Search /><h3>暂时没有完全匹配的菜谱</h3><p>试着放宽时间、难度或食材条件。</p></div>}</div>
        </>}
      </section>
    </main>
    <footer><span>菜谱内容整理自 <a href="https://github.com/Anduin2017/HowToCook" target="_blank" rel="noreferrer">HowToCook</a></span><span>食物过敏请以实际配料为准</span></footer>
    {selected && <RecipeModal recipe={selected} people={preferences.people} onClose={() => setSelected(null)} />}
    {selectedPlan && !selected && <PlanModal plan={selectedPlan} people={preferences.people} onRecipe={setSelected} onClose={() => setSelectedPlan(null)} />}
    {adminOpen && <RecipeAdmin recipes={catalog} onClose={() => setAdminOpen(false)} onSave={(recipe) => { setRecipeOverrides((old) => ({ ...old, [recipe.id]: recipe })); setDeletedRecipes((old) => old.filter((id) => id !== recipe.id)) }} onDelete={(id) => setDeletedRecipes((old) => [...new Set([...old, id])])} onReset={() => { setRecipeOverrides({}); setDeletedRecipes([]) }} />}
  </div>
}
