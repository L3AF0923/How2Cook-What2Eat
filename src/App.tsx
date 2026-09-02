import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bookmark, BookmarkCheck, ChefHat, ChevronDown, Clock3, ExternalLink, Flame, Heart, History, Minus, Plus, RotateCcw, Search, Settings, ShoppingBasket, Sparkles, Users, X } from 'lucide-react'
import type { Difficulty, Meal, MealPlan, Preferences, Recipe, Recommendation } from './types'
import { defaultPreferences, formatIngredientAmount, generateMealPlans, parseQuery } from './lib/recommender'
import { builtInRecipes } from './data/all-recipes'
import RecipeAdmin from './components/RecipeAdmin'

const starters = ['一人份快速午餐', '两个人的清淡晚餐', '用鸡蛋和西红柿做饭', '新手也能做的早餐']
const storage = {
  get<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } },
  set(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)) }
}
const loadPreferences = (): Preferences => ({ ...defaultPreferences, ...storage.get<Partial<Preferences>>('wtet.preferences', {}) })

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

function PlanCard({ plan, people, favorites, onFavorite, onRecipe, onPlan, compact = false }: { plan: MealPlan; people: number; favorites: string[]; onFavorite: (id: string) => void; onRecipe: (recipe: Recipe) => void; onPlan: () => void; compact?: boolean }) {
  return <article className={compact ? 'plan-card compact' : 'plan-card'}>
    <div className="plan-head"><div><span className="eyebrow">{compact ? '另一桌选择' : '今日整桌推荐'}</span><h3>{plan.title}</h3></div><span className="plan-time"><Clock3 /> 约 {plan.estimatedMinutes} 分钟</span></div>
    <p className="plan-summary">{plan.summary}</p>
    {!compact && <div className="balance-notes">{plan.reasons.map((x) => <span key={x}><Sparkles />{x}</span>)}</div>}
    <div className="dish-list">{plan.dishes.map((dish) => <div className="dish-row" key={dish.recipe.id}>
      <button className="dish-main" onClick={() => onRecipe(dish.recipe)}><span className={`role role-${dish.role}`}>{dish.role}</span><span><b>{dish.recipe.name}</b><small>{dish.protein} · {dish.method} · {dish.recipe.minutes} 分钟</small></span></button>
      <button className="favorite" onClick={() => onFavorite(dish.recipe.id)} title="收藏">{favorites.includes(dish.recipe.id) ? <BookmarkCheck /> : <Bookmark />}</button>
    </div>)}</div>
    <button className="plan-detail" onClick={onPlan}><ShoppingBasket /> 查看食材清单与下厨顺序 <ArrowRight /></button>
  </article>
}

function PlanModal({ plan, people, onRecipe, onClose }: { plan: MealPlan; people: number; onRecipe: (recipe: Recipe) => void; onClose: () => void }) {
  const shopping = new Map<string, { name: string; amount: number; unit: string; optional: boolean; originalAmount?: string }>()
  plan.dishes.forEach(({ recipe }) => recipe.ingredients.forEach((item) => {
    const isOriginal = item.scalable === false || !item.amount || !item.unit
    const key = isOriginal ? `${item.name}-原始-${item.originalAmount}` : `${item.name}-${item.unit}`
    const scaled = item.amount * people / recipe.servings
    const old = shopping.get(key)
    shopping.set(key, { name: item.name, amount: isOriginal ? 0 : (old?.amount || 0) + scaled, unit: item.unit, optional: Boolean(item.optional && (old?.optional ?? true)), originalAmount: isOriginal ? item.originalAmount || '适量' : undefined })
  }))
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal plan-modal">
    <button className="modal-close" onClick={onClose}><X /></button>
    <div className="modal-hero"><span className="eyebrow">整套餐单</span><h2>{plan.title}</h2><p>{plan.summary}</p><div className="meta"><span><Clock3 /> 约 {plan.estimatedMinutes} 分钟</span><span><Users /> {people} 人</span><span><ChefHat /> {plan.dishes.length} 个菜品</span></div></div>
    <section><div className="section-title"><ShoppingBasket /><div><span>本桌所需</span><h3>食材清单</h3></div></div><div className="ingredient-list">{[...shopping.values()].map((x) => <div key={`${x.name}-${x.unit}-${x.originalAmount || ''}`}><span>{x.name}{x.optional && <em>可选</em>}</span><b>{x.originalAmount || (x.unit === '个' || x.unit === '根' || x.unit === '瓣' ? `${Math.max(1, Math.round(x.amount * 2) / 2)}${x.unit}` : `${x.amount < 10 ? Math.round(x.amount * 10) / 10 : Math.round(x.amount)}${x.unit}`)}</b></div>)}</div><p className="scale-note">同单位的明确用量已合并；区间、适量及备注保留原菜谱写法。</p></section>
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
  const [results, setResults] = useState<MealPlan[]>(() => generateMealPlans(loadPreferences(), storage.get('wtet.recent-recipes', []), 3, builtInRecipes))
  const [recentRecipes, setRecentRecipes] = useState<string[]>(() => storage.get('wtet.recent-recipes', []))
  const [favorites, setFavorites] = useState<string[]>(() => storage.get('wtet.favorites', []))
  const [history, setHistory] = useState<string[]>(() => storage.get('wtet.history', []))
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => storage.set('wtet.preferences', preferences), [preferences])
  useEffect(() => storage.set('wtet.favorites', favorites), [favorites])
  useEffect(() => storage.set('wtet.history', history), [history])
  useEffect(() => storage.set('wtet.recent-recipes', recentRecipes), [recentRecipes])
  useEffect(() => storage.set('wtet.recipe-overrides', recipeOverrides), [recipeOverrides])
  useEffect(() => storage.set('wtet.deleted-recipes', deletedRecipes), [deletedRecipes])
  useEffect(() => {
    const timer = window.setTimeout(() => setResults(generateMealPlans(preferences, recentRecipes, 3, catalog)), 180)
    return () => window.clearTimeout(timer)
  }, [preferences, catalog])
  const favoriteResults = useMemo(() => favorites.map((id) => catalog.find((recipe) => recipe.id === id)).filter(Boolean).map((recipe) => ({ recipe: recipe!, score: 100, reasons: [] })), [favorites, catalog])
  const toggleFavorite = (id: string) => setFavorites((x) => x.includes(id) ? x.filter((v) => v !== id) : [...x, id])

  const ask = (text = query) => {
    const cleaned = text.trim()
    if (!cleaned) {
      const plans = generateMealPlans(preferences, recentRecipes, 3, catalog)
      setResults(plans); setLastQuery(`按当前偏好推荐 · ${preferences.people} 人${preferences.meal === '不限' ? '' : preferences.meal}`)
      setRecentRecipes((old) => [...plans[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20))
      return
    }
    const parsed = parseQuery(cleaned, preferences)
    const plans = generateMealPlans(parsed, recentRecipes, 3, catalog)
    setPreferences(parsed); setLastQuery(cleaned); setQuery('')
    setResults(plans); setRecentRecipes((old) => [...plans[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20)); setHistory((x) => [cleaned, ...x.filter((v) => v !== cleaned)].slice(0, 8))
  }
  const reroll = () => {
    const currentIds = results.flatMap((plan) => plan.dishes.map((x) => x.recipe.id))
    const next = generateMealPlans(preferences, [...currentIds, ...recentRecipes], 3, catalog)
    setResults(next); setRecentRecipes((old) => [...next[0].dishes.map((x) => x.recipe.id), ...old].slice(0, 20))
  }

  return <div className="app-shell">
    <header><a className="brand" href="#"><span><ChefHat /></span><div><b>今天吃什么</b><small>认真解决每一顿</small></div></a><nav><button onClick={() => setAdminOpen(true)}><Settings size={18} /> 管理</button><button onClick={() => setShowSaved(!showSaved)} className={showSaved ? 'active' : ''}><Bookmark size={18} /> 收藏 <i>{favorites.length}</i></button><button className="history-button"><History size={18} /> 历史<div className="history-popover">{history.length ? history.map((x) => <span key={x} onClick={() => { setQuery(x); ask(x) }}>{x}</span>) : <em>还没有搜索记录</em>}</div></button></nav></header>
    <main>
      <button className="mobile-filter" onClick={() => setFiltersOpen(!filtersOpen)}>调整用餐偏好 <ChevronDown /></button>
      <div className={filtersOpen ? 'filter-wrap open' : 'filter-wrap'}><Filters value={preferences} onChange={setPreferences} /></div>
      <section className="content">
        {showSaved ? <div className="saved-view"><span className="eyebrow">我的收藏</span><h1>留住想吃的味道</h1>{favoriteResults.length ? <div className="card-grid">{favoriteResults.map((item) => <RecipeCard key={item.recipe.id} item={item} people={preferences.people} favorite onFavorite={() => toggleFavorite(item.recipe.id)} onOpen={() => setSelected(item.recipe)} compact />)}</div> : <div className="empty"><Bookmark /><h3>还没有收藏</h3><p>遇到喜欢的菜谱，点一下书签就能留在这里。</p></div>}</div> : <>
          <div className="hero"><span className="eyebrow"><Sparkles size={14} /> 今日灵感</span><h1>今天，想吃点<br/><em>什么好的？</em></h1><p>告诉我人数、时间或手边食材，剩下的交给我。</p></div>
          <div className="ask-box"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="例如：帮我推荐一人份的快速午餐" /><button onClick={() => ask()}>帮我想想 <ArrowRight /></button></div>
          <div className="starters">{starters.map((x) => <button key={x} onClick={() => ask(x)}>{x}</button>)}</div>
          <div className="result-heading"><div><span className="eyebrow">为你推荐</span><h2>{lastQuery}</h2></div><button className="reroll" onClick={reroll}><RotateCcw /> 换一批</button></div>
          {results.length ? <div className="plan-results"><PlanCard plan={results[0]} people={preferences.people} favorites={favorites} onFavorite={toggleFavorite} onRecipe={setSelected} onPlan={() => setSelectedPlan(results[0])} /><div className="plan-alternatives">{results.slice(1).map((plan, index) => <PlanCard key={`${plan.id}-${index}`} plan={plan} people={preferences.people} favorites={favorites} onFavorite={toggleFavorite} onRecipe={setSelected} onPlan={() => setSelectedPlan(plan)} compact />)}</div></div> : <div className="empty"><Search /><h3>暂时没有完全匹配的菜谱</h3><p>试着放宽时间、难度或食材条件。</p></div>}
        </>}
      </section>
    </main>
    <footer><span>菜谱内容整理自 <a href="https://github.com/Anduin2017/HowToCook" target="_blank" rel="noreferrer">HowToCook</a></span><span>食物过敏请以实际配料为准</span></footer>
    {selected && <RecipeModal recipe={selected} people={preferences.people} onClose={() => setSelected(null)} />}
    {selectedPlan && !selected && <PlanModal plan={selectedPlan} people={preferences.people} onRecipe={setSelected} onClose={() => setSelectedPlan(null)} />}
    {adminOpen && <RecipeAdmin recipes={catalog} onClose={() => setAdminOpen(false)} onSave={(recipe) => { setRecipeOverrides((old) => ({ ...old, [recipe.id]: recipe })); setDeletedRecipes((old) => old.filter((id) => id !== recipe.id)) }} onDelete={(id) => setDeletedRecipes((old) => [...new Set([...old, id])])} onReset={() => { setRecipeOverrides({}); setDeletedRecipes([]) }} />}
  </div>
}
