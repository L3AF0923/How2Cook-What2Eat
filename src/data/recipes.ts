import type { Recipe } from '../types'

const base = 'https://github.com/Anduin2017/HowToCook/blob/master/dishes'

export const recipes: Recipe[] = [
  {
    id: 'tomato-egg-noodles', name: '西红柿鸡蛋挂面', category: '主食', servings: 1, minutes: 20,
    difficulty: '新手', calories: 520, meals: ['午餐', '晚餐'], tags: ['不辣', '一锅', '省时', '家常'],
    description: '酸甜开胃的一锅面，食材常见，特别适合一个人的快速午餐。', tools: ['煮锅', '炒锅'],
    ingredients: [{ name: '挂面', amount: 100, unit: 'g' }, { name: '西红柿', amount: 1, unit: '个' }, { name: '鸡蛋', amount: 1.5, unit: '个' }, { name: '食用油', amount: 10, unit: 'ml' }, { name: '盐', amount: 2, unit: 'g' }, { name: '生抽', amount: 5, unit: 'ml', optional: true }],
    steps: ['西红柿洗净切成小块，鸡蛋打散。', '锅中放油，油热后倒入蛋液，凝固后划散并盛出。', '原锅放入西红柿，翻炒至出汁，加约 350ml 水煮沸。', '放入挂面，按包装建议时间煮熟。', '倒回鸡蛋，加入盐和生抽，搅匀后关火。'],
    tips: ['鸡蛋数量按人数换算后可取接近的整数。', '对蛋类过敏者请勿食用。'], source: `${base}/staple/西红柿鸡蛋挂面.md`
  },
  {
    id: 'tomato-eggs', name: '西红柿炒鸡蛋', category: '素菜', servings: 2, minutes: 15,
    difficulty: '新手', calories: 310, meals: ['午餐', '晚餐'], tags: ['不辣', '家常', '下饭'],
    description: '酸甜柔软的经典家常菜，新手也容易成功。', tools: ['炒锅'],
    ingredients: [{ name: '西红柿', amount: 2, unit: '个' }, { name: '鸡蛋', amount: 3, unit: '个' }, { name: '食用油', amount: 15, unit: 'ml' }, { name: '盐', amount: 3, unit: 'g' }, { name: '糖', amount: 5, unit: 'g', optional: true }],
    steps: ['西红柿切块，鸡蛋打散。', '热锅放油，倒入蛋液，刚凝固时划散盛出。', '原锅放入西红柿，中火炒至出汁。', '加入鸡蛋、盐和可选的糖，翻炒均匀后装盘。'],
    tips: ['西红柿充分出汁后再放回鸡蛋，口感更柔软。'], source: `${base}/vegetable_dish/西红柿炒鸡蛋.md`
  },
  {
    id: 'egg-fried-rice', name: '蛋炒饭', category: '主食', servings: 1, minutes: 12,
    difficulty: '新手', calories: 560, meals: ['午餐', '晚餐'], tags: ['省时', '剩饭', '家常'],
    description: '利用剩米饭快速完成的一餐，颗粒分明又饱腹。', tools: ['炒锅'],
    ingredients: [{ name: '熟米饭', amount: 250, unit: 'g' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '食用油', amount: 12, unit: 'ml' }, { name: '葱', amount: 10, unit: 'g', optional: true }, { name: '盐', amount: 2, unit: 'g' }],
    steps: ['将冷藏米饭提前拨散，鸡蛋打散。', '热锅放油，倒入鸡蛋快速划散。', '加入米饭，中大火持续翻炒至米粒松散发热。', '加盐调味，放入葱花翻匀后关火。'],
    tips: ['冷藏米饭水分较少，更容易炒散。'], source: `${base}/staple/蛋炒饭.md`
  },
  {
    id: 'scallion-noodles', name: '葱油拌面', category: '主食', servings: 1, minutes: 18,
    difficulty: '新手', calories: 480, meals: ['午餐', '晚餐'], tags: ['省时', '不辣', '素食'],
    description: '葱香浓郁、材料精简，适合不想复杂备菜的时候。', tools: ['煮锅', '炒锅'],
    ingredients: [{ name: '面条', amount: 120, unit: 'g' }, { name: '小葱', amount: 35, unit: 'g' }, { name: '食用油', amount: 20, unit: 'ml' }, { name: '生抽', amount: 12, unit: 'ml' }, { name: '糖', amount: 4, unit: 'g' }],
    steps: ['小葱洗净擦干，切成长段。', '冷锅放油和葱段，小火加热至葱段焦黄后夹出。', '关火后加入生抽和糖，利用余温搅匀。', '面条煮熟沥水，加入葱油汁拌匀。'],
    tips: ['葱必须擦干再下油锅，避免热油飞溅。'], source: `${base}/staple/葱油拌面.md`
  },
  {
    id: 'cucumber-salad', name: '凉拌黄瓜', category: '素菜', servings: 2, minutes: 10,
    difficulty: '新手', calories: 120, meals: ['午餐', '晚餐'], tags: ['凉菜', '清爽', '素食', '省时'],
    description: '清脆爽口的快手凉菜，可按喜好做成不辣版本。', tools: ['菜刀'],
    ingredients: [{ name: '黄瓜', amount: 2, unit: '根' }, { name: '大蒜', amount: 2, unit: '瓣', optional: true }, { name: '生抽', amount: 10, unit: 'ml' }, { name: '香醋', amount: 10, unit: 'ml' }, { name: '香油', amount: 5, unit: 'ml' }, { name: '辣椒油', amount: 5, unit: 'ml', optional: true }],
    steps: ['黄瓜洗净，用刀背拍裂后切段。', '大蒜切末，与生抽、香醋和香油混合。', '将料汁倒入黄瓜，拌匀后静置 5 分钟。', '能吃辣时再加入辣椒油。'],
    tips: ['不吃辣时省略辣椒油即可。'], source: `${base}/vegetable_dish/凉拌黄瓜.md`
  },
  {
    id: 'oyster-lettuce', name: '蚝油生菜', category: '素菜', servings: 2, minutes: 12,
    difficulty: '新手', calories: 150, meals: ['午餐', '晚餐'], tags: ['快手', '清淡', '不辣'],
    description: '生菜爽脆、酱汁鲜香，是十几分钟即可完成的配菜。', tools: ['炒锅'],
    ingredients: [{ name: '生菜', amount: 400, unit: 'g' }, { name: '大蒜', amount: 2, unit: '瓣', optional: true }, { name: '蚝油', amount: 15, unit: 'ml' }, { name: '生抽', amount: 5, unit: 'ml' }, { name: '食用油', amount: 8, unit: 'ml' }],
    steps: ['生菜逐片洗净并沥干。', '锅中烧水，放几滴油，将生菜焯 20 秒后捞出。', '另起锅放油和蒜末，小火炒香。', '加入蚝油、生抽和少量水煮开，淋在生菜上。'],
    tips: ['蚝油可能含有贝类成分，贝类过敏者不要选择。'], source: `${base}/vegetable_dish/蚝油生菜.md`
  },
  {
    id: 'cola-wings', name: '可乐鸡翅', category: '荤菜', servings: 2, minutes: 35,
    difficulty: '普通', calories: 760, meals: ['午餐', '晚餐'], tags: ['甜口', '不辣', '下饭'],
    description: '咸甜入味、色泽红亮，是很受欢迎的家常荤菜。', tools: ['炒锅'],
    ingredients: [{ name: '鸡翅中', amount: 500, unit: 'g' }, { name: '可乐', amount: 330, unit: 'ml' }, { name: '生抽', amount: 20, unit: 'ml' }, { name: '姜', amount: 10, unit: 'g', optional: true }, { name: '食用油', amount: 8, unit: 'ml' }],
    steps: ['鸡翅洗净擦干，两面各划两刀。', '热锅放少量油，将鸡翅两面煎至金黄。', '加入姜、生抽和可乐，液体接近没过鸡翅。', '煮沸后转小火加盖焖 20 分钟。', '开盖转中火，不断翻动至汤汁浓稠。'],
    tips: ['收汁阶段糖分容易焦化，需要持续观察。'], source: `${base}/meat_dish/可乐鸡翅.md`
  },
  {
    id: 'steamed-egg', name: '鸡蛋羹', category: '素菜', servings: 1, minutes: 18,
    difficulty: '新手', calories: 180, meals: ['早餐', '午餐', '晚餐'], tags: ['清淡', '不辣', '柔软'],
    description: '柔软细腻、口味清淡，早午晚餐都合适。', tools: ['蒸锅'],
    ingredients: [{ name: '鸡蛋', amount: 2, unit: '个' }, { name: '温水', amount: 180, unit: 'ml' }, { name: '盐', amount: 1, unit: 'g' }, { name: '香油', amount: 3, unit: 'ml', optional: true }],
    steps: ['鸡蛋加入盐充分打散。', '加入约为蛋液 1.5 倍体积的温水，轻轻搅匀。', '过滤蛋液表面泡沫，容器盖盘或耐热保鲜膜。', '水开后放入蒸锅，中小火蒸约 10 分钟。', '关火焖 2 分钟，取出后可滴香油。'],
    tips: ['蒸制时间会受容器深度影响，以中心凝固为准。'], source: `${base}/vegetable_dish/鸡蛋羹.md`
  },
  {
    id: 'milk-oats', name: '牛奶燕麦', category: '早餐', servings: 1, minutes: 8,
    difficulty: '新手', calories: 330, meals: ['早餐'], tags: ['省时', '不辣', '素食'],
    description: '八分钟完成的温暖早餐，适合忙碌的工作日。', tools: ['煮锅'],
    ingredients: [{ name: '即食燕麦', amount: 50, unit: 'g' }, { name: '牛奶', amount: 250, unit: 'ml' }, { name: '香蕉', amount: 0.5, unit: '根', optional: true }],
    steps: ['燕麦和牛奶倒入小锅。', '小火加热并持续搅拌，避免粘底。', '微沸后再煮 2 分钟，达到喜欢的浓稠度后关火。', '可加入切片香蕉。'],
    tips: ['牛奶容易扑锅，全程使用小火。'], source: `${base}/breakfast/牛奶燕麦.md`
  },
  {
    id: 'potato-ribs', name: '土豆炖排骨', category: '荤菜', servings: 3, minutes: 60,
    difficulty: '普通', calories: 1280, meals: ['午餐', '晚餐'], tags: ['下饭', '炖菜', '不辣'],
    description: '排骨酥香、土豆绵软，适合多人共享的一锅炖菜。', tools: ['炒锅', '炖锅'],
    ingredients: [{ name: '排骨', amount: 600, unit: 'g' }, { name: '土豆', amount: 450, unit: 'g' }, { name: '姜', amount: 12, unit: 'g', optional: true }, { name: '生抽', amount: 25, unit: 'ml' }, { name: '老抽', amount: 8, unit: 'ml' }, { name: '食用油', amount: 10, unit: 'ml' }],
    steps: ['排骨冷水下锅，煮沸后撇去浮沫，捞出洗净。', '土豆去皮切约 3cm 块。', '锅中放油，排骨煎至表面微黄，加入生抽和老抽。', '加热水没过排骨，小火炖 30 分钟。', '放入土豆继续炖约 15 分钟，至土豆软熟后收汁。'],
    tips: ['炖煮时添加热水，避免肉质突然收紧。'], source: `${base}/meat_dish/土豆炖排骨.md`
  },
  {
    id: 'seaweed-egg-soup', name: '紫菜蛋花汤', category: '汤', servings: 2, minutes: 10,
    difficulty: '新手', calories: 140, meals: ['午餐', '晚餐'], tags: ['快手', '清淡', '不辣'],
    description: '十分钟上桌的清淡汤品，适合搭配炒饭或家常菜。', tools: ['煮锅'],
    ingredients: [{ name: '紫菜', amount: 8, unit: 'g' }, { name: '鸡蛋', amount: 1, unit: '个' }, { name: '水', amount: 600, unit: 'ml' }, { name: '盐', amount: 2, unit: 'g' }, { name: '香油', amount: 3, unit: 'ml', optional: true }],
    steps: ['紫菜撕成小片，鸡蛋打散。', '锅中水烧开，放入紫菜煮 1 分钟。', '保持微沸，将蛋液细细淋入锅中。', '待蛋花凝固后轻推，加盐和香油后关火。'],
    tips: ['淋入蛋液后不要立刻搅动，蛋花更完整。'], source: `${base}/soup/紫菜蛋花汤.md`
  },
  {
    id: 'braised-tofu', name: '家常日本豆腐', category: '素菜', servings: 2, minutes: 25,
    difficulty: '普通', calories: 460, meals: ['午餐', '晚餐'], tags: ['下饭', '不辣', '素食'],
    description: '外层微焦、内部嫩滑，配米饭很合适。', tools: ['炒锅'],
    ingredients: [{ name: '日本豆腐', amount: 300, unit: 'g' }, { name: '青椒', amount: 80, unit: 'g' }, { name: '胡萝卜', amount: 60, unit: 'g' }, { name: '淀粉', amount: 25, unit: 'g' }, { name: '生抽', amount: 12, unit: 'ml' }, { name: '食用油', amount: 25, unit: 'ml' }],
    steps: ['日本豆腐切成约 2cm 厚的段，表面均匀裹淀粉。', '青椒和胡萝卜切片。', '锅中放油，将豆腐两面煎至微黄后盛出。', '炒香青椒和胡萝卜，加生抽和少量水。', '放回豆腐，小心翻匀，汤汁略浓后关火。'],
    tips: ['日本豆腐容易碎，翻动时使用锅铲轻推。'], source: `${base}/vegetable_dish/家常日本豆腐.md`
  },
  {
    id: 'steamed-perch', name: '清蒸鲈鱼', category: '水产', servings: 3, minutes: 30,
    difficulty: '普通', calories: 520, meals: ['午餐', '晚餐'], tags: ['鱼', '清淡', '不辣', '蒸菜'],
    description: '鱼肉鲜嫩、口味清爽，适合作为多人餐桌上的水产主菜。', tools: ['蒸锅'],
    ingredients: [{ name: '鲈鱼', amount: 600, unit: 'g' }, { name: '姜', amount: 15, unit: 'g' }, { name: '葱', amount: 20, unit: 'g' }, { name: '蒸鱼豉油', amount: 20, unit: 'ml' }, { name: '食用油', amount: 10, unit: 'ml' }],
    steps: ['鲈鱼处理干净，在鱼身两侧各划两刀。', '鱼身铺姜片和葱段，水沸后放入蒸锅。', '大火蒸约 8 分钟，关火焖 2 分钟。', '倒掉盘中汁水，取出旧葱姜，淋蒸鱼豉油。', '铺上新葱丝，淋入加热后的食用油。'],
    tips: ['蒸制时间需根据鱼的大小调整，鱼肉完全变白且能轻松脱骨才算熟。'], source: `${base}/aquatic/清蒸鲈鱼.md`
  },
  {
    id: 'boiled-shrimp', name: '白灼虾', category: '水产', servings: 3, minutes: 15,
    difficulty: '新手', calories: 360, meals: ['午餐', '晚餐'], tags: ['虾', '清淡', '不辣', '快手'],
    description: '最大程度保留鲜虾本味，准备简单，也适合多人共享。', tools: ['煮锅'],
    ingredients: [{ name: '鲜虾', amount: 500, unit: 'g' }, { name: '姜', amount: 10, unit: 'g' }, { name: '葱', amount: 15, unit: 'g' }, { name: '料酒', amount: 10, unit: 'ml', optional: true }, { name: '生抽', amount: 15, unit: 'ml' }],
    steps: ['鲜虾洗净，剪去过长的虾须。', '锅中加水、姜、葱和料酒并煮沸。', '放入鲜虾，保持沸腾至虾身弯曲变红。', '捞出沥水，搭配生抽食用。'],
    tips: ['甲壳类过敏者不可食用。', '虾必须完全变色熟透。'], source: `${base}/aquatic/白灼虾.md`
  },
  {
    id: 'black-pepper-beef', name: '黑椒牛柳', category: '荤菜', servings: 3, minutes: 30,
    difficulty: '普通', calories: 820, meals: ['午餐', '晚餐'], tags: ['牛肉', '下饭', '煎炒'],
    description: '牛肉滑嫩、黑椒香浓，适合作为多人套餐中的牛肉主菜。', tools: ['炒锅'],
    ingredients: [{ name: '牛里脊', amount: 450, unit: 'g' }, { name: '洋葱', amount: 150, unit: 'g' }, { name: '青椒', amount: 100, unit: 'g' }, { name: '黑胡椒', amount: 4, unit: 'g' }, { name: '生抽', amount: 15, unit: 'ml' }, { name: '食用油', amount: 15, unit: 'ml' }],
    steps: ['牛里脊逆纹切条，用生抽和一半黑胡椒抓匀。', '洋葱和青椒切条。', '热锅放油，将牛肉快速滑炒至变色后盛出。', '原锅炒香洋葱和青椒，放回牛肉。', '加入剩余黑胡椒，大火翻匀后关火。'],
    tips: ['牛肉变色后先盛出，避免长时间加热导致口感变硬。'], source: `${base}/meat_dish/黑椒牛柳.md`
  },
  {
    id: 'garlic-broccoli', name: '蒜蓉西兰花', category: '素菜', servings: 3, minutes: 15,
    difficulty: '新手', calories: 220, meals: ['午餐', '晚餐'], tags: ['绿叶菜', '清淡', '不辣', '快手', '素食'],
    description: '清脆翠绿的快手蔬菜，为多人套餐补充蔬菜和清爽口感。', tools: ['炒锅'],
    ingredients: [{ name: '西兰花', amount: 450, unit: 'g' }, { name: '大蒜', amount: 4, unit: '瓣' }, { name: '食用油', amount: 12, unit: 'ml' }, { name: '盐', amount: 3, unit: 'g' }],
    steps: ['西兰花切成均匀小朵，用清水洗净。', '沸水中加少许盐，将西兰花焯 40 秒后沥水。', '热锅放油，小火炒香蒜末。', '加入西兰花转大火翻炒约 1 分钟，加盐后出锅。'],
    tips: ['焯水和炒制时间不宜过长，以保持翠绿和脆嫩。'], source: `${base}/vegetable_dish/蒜蓉西兰花.md`
  },
  {
    id: 'hand-torn-cabbage', name: '手撕包菜', category: '素菜', servings: 3, minutes: 15,
    difficulty: '新手', calories: 260, meals: ['午餐', '晚餐'], tags: ['蔬菜', '快手', '素食'],
    description: '爽脆下饭的家常蔬菜，可以按需求制作不辣版本。', tools: ['炒锅'],
    ingredients: [{ name: '包菜', amount: 500, unit: 'g' }, { name: '大蒜', amount: 3, unit: '瓣', optional: true }, { name: '干辣椒', amount: 3, unit: '个', optional: true }, { name: '香醋', amount: 10, unit: 'ml' }, { name: '食用油', amount: 12, unit: 'ml' }],
    steps: ['包菜洗净沥干，用手撕成大小接近的片。', '热锅放油，小火炒香蒜和可选的干辣椒。', '转大火加入包菜，快速翻炒至稍微变软。', '沿锅边淋入香醋，翻匀后出锅。'],
    tips: ['不吃辣时完全省略干辣椒。'], source: `${base}/vegetable_dish/手撕包菜.md`
  },
  {
    id: 'tomato-egg-soup', name: '西红柿鸡蛋汤', category: '汤', servings: 3, minutes: 15,
    difficulty: '新手', calories: 210, meals: ['午餐', '晚餐'], tags: ['汤', '清淡', '不辣', '快手'],
    description: '酸甜清爽的家常汤，适合搭配偏油或偏咸的主菜。', tools: ['煮锅'],
    ingredients: [{ name: '西红柿', amount: 2, unit: '个' }, { name: '鸡蛋', amount: 2, unit: '个' }, { name: '水', amount: 900, unit: 'ml' }, { name: '盐', amount: 3, unit: 'g' }, { name: '食用油', amount: 5, unit: 'ml' }],
    steps: ['西红柿切块，鸡蛋打散。', '锅中放少量油，将西红柿炒至出汁。', '加水煮沸后保持微沸 2 分钟。', '细细淋入蛋液，凝固后轻推。', '加盐调味后关火。'],
    tips: ['淋蛋液时保持水面微沸，蛋花更轻盈。'], source: `${base}/soup/西红柿鸡蛋汤.md`
  },
  {
    id: 'chili-pork', name: '辣椒炒肉', category: '荤菜', servings: 2, minutes: 25,
    difficulty: '普通', calories: 720, meals: ['午餐', '晚餐'], tags: ['猪肉', '辣', '下饭', '炒菜'],
    description: '香辣下饭的经典家常菜，一个人也可以按比例少量制作。', tools: ['炒锅'],
    ingredients: [{ name: '猪肉', amount: 300, unit: 'g' }, { name: '青辣椒', amount: 200, unit: 'g' }, { name: '大蒜', amount: 3, unit: '瓣' }, { name: '生抽', amount: 12, unit: 'ml' }, { name: '食用油', amount: 12, unit: 'ml' }, { name: '盐', amount: 2, unit: 'g' }],
    steps: ['猪肉切薄片，青辣椒切片，大蒜切碎。', '热锅不放油，将青辣椒煸至表面微皱后盛出。', '锅中放油，加入猪肉片翻炒至变色出油。', '加入蒜末和青辣椒，大火翻炒均匀。', '加入生抽和盐，翻炒约 30 秒后出锅。'],
    tips: ['一人份按比例减量即可，不必因为原菜谱份数而排除。'], source: `${base}/meat_dish/辣椒炒肉.md`
  }
]
