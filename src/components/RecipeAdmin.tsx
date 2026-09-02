import { useMemo, useState } from 'react'
import { Edit3, Plus, RotateCcw, Search, Settings, Trash2, X } from 'lucide-react'
import type { Difficulty, Ingredient, Meal, Recipe } from '../types'

const categories = ['素菜', '荤菜', '水产', '早餐', '主食', '半成品加工', '汤', '饮品', '调料', '甜品']
const blankRecipe = (): Recipe => ({
  id: `custom-${Date.now()}`, name: '', category: '素菜', description: '', servings: 2, minutes: 30,
  difficulty: '新手', meals: ['午餐', '晚餐'], tags: [], ingredients: [], tools: [], steps: [], tips: [], source: ''
})

function ingredientsToText(items: Ingredient[]) {
  return items.map((item) => `${item.name} | ${item.amount} | ${item.unit}${item.optional ? ' | 可选' : ''}`).join('\n')
}
function textToIngredients(text: string): Ingredient[] {
  return text.split(/\r?\n/).map((line) => {
    const [name, amount, unit, optional] = line.split('|').map((x) => x.trim())
    return { name, amount: Number(amount) || 1, unit: unit || '份', optional: optional === '可选' }
  }).filter((item) => item.name)
}

export default function RecipeAdmin({ recipes, onSave, onDelete, onReset, onClose }: { recipes: Recipe[]; onSave: (recipe: Recipe) => void; onDelete: (id: string) => void; onReset: () => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [ingredientsText, setIngredientsText] = useState('')
  const [stepsText, setStepsText] = useState('')
  const filtered = useMemo(() => recipes.filter((recipe) => `${recipe.name}${recipe.category}${recipe.ingredients.map((x) => x.name).join('')}`.toLowerCase().includes(search.toLowerCase())).slice(0, 200), [recipes, search])
  const edit = (recipe: Recipe) => { setEditing(structuredClone(recipe)); setIngredientsText(ingredientsToText(recipe.ingredients)); setStepsText(recipe.steps.join('\n')) }
  const create = () => edit(blankRecipe())
  const save = () => {
    if (!editing?.name.trim()) return
    onSave({ ...editing, name: editing.name.trim(), ingredients: textToIngredients(ingredientsText), steps: stepsText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), source: editing.source.trim() })
    setEditing(null)
  }
  const set = <K extends keyof Recipe>(key: K, value: Recipe[K]) => editing && setEditing({ ...editing, [key]: value })
  return <div className="admin-backdrop"><div className="admin-panel">
    <header className="admin-header"><div><span className="eyebrow"><Settings size={14} /> 菜谱管理</span><h2>{recipes.length} 道可用菜谱</h2></div><div><button className="admin-reset" onClick={() => confirm('恢复全部内置菜谱并清除浏览器中的增删改记录？') && onReset()}><RotateCcw /> 恢复内置</button><button className="modal-close" onClick={onClose}><X /></button></div></header>
    {editing ? <div className="recipe-editor">
      <div className="editor-heading"><h3>{editing.name || '添加新菜谱'}</h3><button onClick={() => setEditing(null)}><X />取消</button></div>
      <div className="editor-grid">
        <label>菜名<input value={editing.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>分类<select value={editing.category} onChange={(e) => set('category', e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>标准份数<input type="number" min="1" max="20" value={editing.servings} onChange={(e) => set('servings', Number(e.target.value))} /></label>
        <label>预计分钟<input type="number" min="1" max="600" value={editing.minutes} onChange={(e) => set('minutes', Number(e.target.value))} /></label>
        <label>难度<select value={editing.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}><option>新手</option><option>普通</option><option>进阶</option></select></label>
        <label>适用餐次<select value={editing.meals[0] || '不限'} onChange={(e) => set('meals', e.target.value === '不限' ? ['不限'] : [e.target.value as Meal])}><option>不限</option><option>早餐</option><option>午餐</option><option>晚餐</option></select></label>
      </div>
      <label>简介<textarea value={editing.description} onChange={(e) => set('description', e.target.value)} rows={3} /></label>
      <label>食材清单 <small>每行：名称 | 数量 | 单位 | 可选</small><textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} rows={8} placeholder={'牛肉 | 300 | g\n生抽 | 10 | ml'} /></label>
      <label>操作步骤 <small>每行一个步骤</small><textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} rows={9} /></label>
      <label>原始来源链接<input value={editing.source} onChange={(e) => set('source', e.target.value)} /></label>
      <button className="save-recipe" onClick={save}>保存菜谱</button>
    </div> : <>
      <div className="admin-toolbar"><div className="admin-search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索菜名、分类或食材" /></div><button className="add-recipe" onClick={create}><Plus />添加菜谱</button></div>
      <div className="admin-list">{filtered.map((recipe) => <article key={recipe.id}><div><span>{recipe.category}</span><h3>{recipe.name}</h3><p>{recipe.ingredients.slice(0, 5).map((x) => x.name).join('、') || '尚未结构化食材'} · {recipe.minutes} 分钟</p></div><div><button title="编辑" onClick={() => edit(recipe)}><Edit3 /></button><button className="danger" title="删除" onClick={() => confirm(`确定删除“${recipe.name}”？`) && onDelete(recipe.id)}><Trash2 /></button></div></article>)}</div>
      {recipes.length > 200 && !search && <p className="admin-limit">为保证页面流畅，当前仅展示前 200 道；输入关键词可搜索全部菜谱。</p>}
    </>}
  </div></div>
}
