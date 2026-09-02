import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = path.resolve('vendor/HowToCook/dishes')
const output = path.resolve('src/data/generated-recipes.json')
const categoryMap = {
  vegetable_dish: '素菜', meat_dish: '荤菜', aquatic: '水产', breakfast: '早餐',
  staple: '主食', 'semi-finished': '半成品加工', soup: '汤', drink: '饮品',
  condiment: '调料', dessert: '甜品'
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : []
  }))
  return nested.flat()
}

const clean = (text) => text.replace(/<!--.*?-->/gs, '').replace(/\*\*|__|`/g, '').trim()
const slug = (text) => text.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase()

function section(markdown, names) {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((line) => /^##+\s+/.test(line) && names.some((name) => line.includes(name)))
  if (start < 0) return ''
  const level = lines[start].match(/^#+/)?.[0].length || 2
  const end = lines.findIndex((line, index) => index > start && new RegExp(`^#{1,${level}}\\s+`).test(line))
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n')
}

function parseIngredient(line) {
  let value = clean(line.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+[.)、]\s*/, ''))
  value = value.replace(/\[[^\]]+\]\([^)]*\)/g, '').replace(/（[^）]*(?:可选|品牌)[^）]*）/g, '').trim()
  if (!value || value.startsWith('注意') || value.length > 80) return null
  const optional = /可选|按需/.test(line)
  const amountMatch = value.match(/(?:约|大约)?\s*(\d+(?:\.\d+)?)(?:\s*[-~～至到]\s*(\d+(?:\.\d+)?))?\s*(g|kg|克|千克|ml|mL|毫升|升|个|只|颗|粒|根|株|段|瓣|片|勺|茶匙|汤匙|份|袋|盒|包|块|碗|杯|把|双)/i)
  let name = amountMatch ? value.slice(0, amountMatch.index).replace(/[：:\s]+$/, '') : value.split(/[（(：:]/)[0].trim()
  name = name.replace(/适量|少量|若干|可选/g, '').trim()
  if (!name || name.length > 24) return null
  const unitMap = { 克: 'g', 千克: 'kg', 毫升: 'ml', mL: 'ml' }
  const originalAmount = amountMatch ? value.slice(amountMatch.index).trim() : value.slice(name.length).replace(/^[：:\s]+/, '').trim()
  return {
    name,
    amount: amountMatch ? Number(amountMatch[1]) : 0,
    unit: amountMatch ? (unitMap[amountMatch[3]] || amountMatch[3].toLowerCase()) : '',
    scalable: Boolean(amountMatch) && !amountMatch[2],
    optional,
    originalAmount: originalAmount || '适量'
  }
}

function inferTags(name, category, text) {
  const tags = []
  if (/辣|椒|麻婆|水煮/.test(name) && !/甜椒|彩椒/.test(name)) tags.push('辣')
  else tags.push('不辣')
  if (/鸡/.test(text)) tags.push('鸡肉')
  if (/猪|排骨|五花|肉丝|肉末/.test(text)) tags.push('猪肉')
  if (/牛肉|牛腩|牛柳|牛排|牛肋|牛骨|肥牛/.test(text)) tags.push('牛肉')
  if (/羊/.test(text)) tags.push('羊肉')
  if (/虾|蟹|蛏|贝/.test(text)) tags.push('虾蟹')
  if (/鱼|鳝/.test(text)) tags.push('鱼')
  if (category === '素菜') tags.push('素食')
  if (/凉拌|凉菜/.test(name)) tags.push('凉拌')
  if (/汤|粥/.test(name)) tags.push('汤')
  return [...new Set(tags)]
}

function parseRecipe(file, markdown) {
  const relative = path.relative(root, file).replaceAll('\\', '/')
  if (relative.startsWith('template/') || /README|readme/.test(relative)) return null
  const topFolder = relative.split('/')[0]
  const category = categoryMap[topFolder]
  if (!category) return null
  const fallbackName = path.basename(file, '.md')
  const heading = clean(markdown).match(/^#\s+(.+?)(?:的做法)?\s*$/m)?.[1]?.trim()
  const name = (heading || fallbackName).replace(/的做法$/, '').trim()
  if (!name || name === '示例菜') return null
  const calculation = section(markdown, ['计算'])
  const required = section(markdown, ['必备原料', '原料和工具', '食材'])
  const calculationLines = calculation.split(/\r?\n/).filter((line) => /^\s*[-*+]\s+/.test(line))
  const requiredLines = required.split(/\r?\n/).filter((line) => /^\s*[-*+]\s+/.test(line))
  const ingredientLines = calculationLines.length ? calculationLines : requiredLines
  const ingredientMap = new Map()
  for (const line of ingredientLines) {
    const item = parseIngredient(line)
    if (item && !ingredientMap.has(item.name)) ingredientMap.set(item.name, item)
  }
  const operation = section(markdown, ['操作', '步骤', '做法'])
  const steps = operation.split(/\r?\n/).filter((line) => /^\s*(?:\d+[.)、]|[-*+])\s+/.test(line)).map((line) => clean(line.replace(/^\s*(?:\d+[.)、]|[-*+])\s+/, ''))).filter((line) => line.length > 3).slice(0, 30)
  const introBody = clean(markdown).split(/^##/m)[0].replace(/^#.*$/m, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\n\s*\n/).map((x) => x.trim()).find((x) => x && !x.startsWith('预估'))
  const servingsMatch = markdown.match(/一份[^。\n]{0,30}?(\d+)\s*个?人/) || markdown.match(/(?:适合|供)\s*(\d+)\s*个?人/)
  const minuteMatches = [...markdown.matchAll(/(\d+)\s*(?:-|到|~|～)?\s*(\d+)?\s*分钟/g)].map((x) => Number(x[2] || x[1])).filter((x) => x > 0 && x <= 360)
  const stars = markdown.match(/预估烹饪难度[：:]?\s*(★+)/)?.[1]?.length || 0
  const difficulty = stars >= 4 ? '进阶' : stars >= 3 ? '普通' : '新手'
  const text = `${name}|${[...ingredientMap.keys()].join('|')}`
  const urlPath = relative.split('/').map(encodeURIComponent).join('/')
  return {
    id: `htc-${slug(relative.replace(/\.md$/, ''))}`,
    name, category, description: introBody?.slice(0, 180) || `${name}的详细做法。`,
    servings: Number(servingsMatch?.[1] || 2), minutes: minuteMatches.length ? Math.max(...minuteMatches.slice(0, 8)) : 30,
    difficulty, meals: category === '早餐' ? ['早餐'] : category === '饮品' || category === '甜品' || category === '调料' ? ['不限'] : ['午餐', '晚餐'],
    tags: inferTags(name, category, text), ingredients: [...ingredientMap.values()], tools: [],
    steps: steps.length ? steps : ['请打开 HowToCook 原始菜谱查看完整操作步骤。'],
    tips: ingredientMap.size ? [] : ['此菜谱的原料格式未能完全结构化，请同时参考原始菜谱。'],
    source: `https://github.com/Anduin2017/HowToCook/blob/master/dishes/${urlPath}`
  }
}

const files = await walk(root)
const parsed = []
for (const file of files) {
  const recipe = parseRecipe(file, await fs.readFile(file, 'utf8'))
  if (recipe) parsed.push(recipe)
}
parsed.sort((a, b) => a.category.localeCompare(b.category, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'))
await fs.writeFile(output, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ markdownFiles: files.length, recipes: parsed.length, withIngredients: parsed.filter((x) => x.ingredients.length).length, withSteps: parsed.filter((x) => !x.steps[0].startsWith('请打开')).length, output }, null, 2))
