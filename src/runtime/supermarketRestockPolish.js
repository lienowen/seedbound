import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";
import { CAMPAIGN_CHAPTERS, CAMPAIGN_FINALE, CAMPAIGN_I18N } from "../i18n/campaign.js";
import { UI } from "../i18n/ui.js";

let applied = false;

const ALL_TAGS = ["carton", "dairy", "box", "bottle", "food", "jar", "can", "tube"];
const CATEGORY_ORDER = ["beverages", "dairy", "fresh", "meals", "sauces", "groceries"];

const CATEGORY_BY_IMAGE = {
  juice: "beverages",
  "green-soda": "beverages",
  "red-soda": "beverages",
  milk: "dairy",
  yogurt: "dairy",
  cheese: "dairy",
  butter: "dairy",
  lettuce: "fresh",
  strawberries: "fresh",
  apple: "fresh",
  broccoli: "fresh",
  tomato: "fresh",
  carrot: "fresh",
  watermelon: "fresh",
  corn: "fresh",
  eggs: "meals",
  mealbox: "meals",
  cake: "meals",
  fish: "meals",
  bread: "meals",
  mustard: "sauces",
  ketchup: "sauces",
};

const EARLY_ROSTERS = {
  "fridge-br-1": ["green-soda", "red-soda", "juice"],
  "fridge-br-2": ["green-soda", "juice", "milk", "yogurt", "cheese", "butter"],
  "fridge-br-3": ["green-soda", "red-soda", "milk", "carrot", "broccoli", "tomato"],
};

const STORY = {
  en: [
    ["First Delivery", "Start with one simple drinks row.", "The morning truck is here. Match each drink to the labeled shelf.", "Stock every drink on the BEVERAGES shelf.", "Training"],
    ["Cold Aisle Basics", "Two product families, one clean cabinet.", "Now the cooler mixes drinks and dairy. Read the shelf labels before you place anything.", "Restock BEVERAGES and DAIRY without mixing the rows.", "Easy"],
    ["Fresh Morning Rush", "The produce order arrives early.", "Fresh goods join the cold aisle. Keep each family together so customers can scan the cabinet quickly.", "Match beverages, dairy and fresh goods to their labeled shelves.", "Easy"],
    ["Lunch Break Refill", "The ready-meal shelf is emptying fast.", "Office workers cleared half the cabinet. Refill the missing facings before the lunch queue grows.", "Complete the labeled shelves and keep each row faced up.", "Normal"],
    ["Friday Drinks Run", "Weekend demand starts early.", "Drinks are moving fast and the cooler looks patchy. Rebuild clean rows before the evening rush.", "Face up every product family and finish the drink rows cleanly.", "Normal"],
    ["Market Day Delivery", "Fresh stock lands all at once.", "A larger delivery mixes produce, dairy and ready meals. Sort before the trolley blocks the aisle.", "Restock each category and clear the delivery tray.", "Normal"],
    ["Afternoon Snack Wave", "Small gaps turn into empty rows.", "The after-school crowd keeps pulling products forward. Refill fast without mixing categories.", "Restore every labeled shelf and finish all facings.", "Normal"],
    ["Weekly Meal Prep", "Prepared food takes over the cooler.", "Meal boxes and chilled essentials arrive together. Build stable, readable rows.", "Complete the meal, dairy and drink facings.", "Busy"],
    ["Surprise Inspection", "The manager is walking the aisle.", "No random gaps, no mixed categories. Make the cooler look ready for inspection.", "Finish every labeled row with no products left in the tray.", "Rush"],
    ["First Month Target", "The store is finally finding its rhythm.", "You have one full month of deliveries behind you. This restock decides whether you get the busy-season shift.", "Complete every category block and leave the cooler fully faced.", "Milestone"],
    ["Sunday Recovery", "A busy weekend leaves broken rows.", "Returns, late stock and missing facings arrive together. Recover the cooler without losing the layout.", "Restore the planogram and handle every delivery event.", "Surprise"],
    ["Healthy Promotion", "Fresh products move faster today.", "A promotion drives demand for fresh and dairy goods. Keep the cabinet readable through customer pickups.", "Refill every category after customer demand changes the shelf.", "Precise"],
    ["BBQ Weekend", "Sauces and drinks are flying.", "The weekend order is bigger than expected. Keep sauces grouped and absorb late bottles when they arrive.", "Restock the BBQ categories and survive the late delivery.", "Busy"],
    ["Holiday Return", "The first truck is not the last one.", "The store reopens after the holiday. Leave capacity for a second wave while you stock the first.", "Finish every category after both deliveries arrive.", "Packed"],
    ["Chef's Picks", "Premium stock brings premium pressure.", "A local chef sends customers your way. Handle the supplier mistake and keep the premium rows clean.", "Return the bad delivery and complete the labeled facings.", "Chef"],
    ["Birthday Rush", "Party orders keep changing the shelf.", "Drinks move first, then extra stock appears. Stay flexible without mixing rows.", "Absorb the late delivery and complete every category shelf.", "Party"],
    ["Midnight Essentials", "A quiet shift still needs perfect recovery.", "One late customer breaks the neat layout. Put the missing product back where shoppers expect it.", "Restore every facing after the customer pickup.", "Zen+"],
    ["Peak Hour", "Delivery pressure and customer pressure collide.", "New stock arrives while shoppers keep taking products. This is the first full rush simulation.", "Keep every category correct through both dynamic events.", "Expert"],
    ["Festival Eve", "The whole neighborhood is shopping tonight.", "Build the celebration cooler, then recover from one last-minute order.", "Finish a clean festival planogram after demand changes the shelf.", "Premium"],
    ["Grand Restock Night", "Three shifts. One packed store.", "Build the base, absorb the final delivery, then recover from the last pickup of the night.", "Complete all three shifts and leave every shelf fully faced.", "Showcase"],
  ],
  cn: [
    ["第一批到货", "先学会补齐一排饮料。", "早班货车到了。看清货架标签，把饮料补到正确排面。", "把所有饮料补到“饮料”货架。", "教学"],
    ["冷柜补货基础", "两类商品，一台整洁冷柜。", "这次同时有饮料和乳制品。先看标签，再动手。", "把饮料和乳制品分别补到对应货架。", "简单"],
    ["清晨生鲜潮", "生鲜订单一早就到了。", "生鲜开始进入冷柜。把同类商品放在一起，让顾客一眼看懂。", "按标签补齐饮料、乳制品和生鲜。", "简单"],
    ["午餐高峰补货", "即食货架正在快速变空。", "上班族刚扫掉半个冷柜，午餐队伍还在变长。", "补齐所有标记货架，并保持整排整齐。", "普通"],
    ["周五饮料潮", "周末需求提前来了。", "饮料卖得很快，冷柜开始出现空洞。晚高峰前把排面补回来。", "补齐各类商品，重点恢复饮料排面。", "普通"],
    ["赶集日到货", "大批生鲜一次进店。", "生鲜、乳制品和即食商品混在一车里，先分清再上架。", "按类别完成补货，并清空送货托盘。", "普通"],
    ["下午零食潮", "小缺口很快会变成空货架。", "放学人流不断拿走商品。快速补回，但别混排。", "恢复所有标记货架并补满排面。", "普通"],
    ["一周餐食备货", "即食商品占据冷柜主场。", "便当和冷藏必需品一起到货，整排规划比单件摆放更重要。", "补齐即食、乳制品和饮料排面。", "繁忙"],
    ["突击巡店", "经理正在沿着通道检查。", "不能乱放，不能混类，也不能留明显空洞。", "补齐所有标记排面，并清空托盘。", "高峰"],
    ["首月目标", "小店终于找到节奏。", "你已经完成整整一个月的到货任务，这次决定能否进入旺季班次。", "完成所有分类区块，让整台冷柜满排面。", "里程碑"],
    ["周日恢复", "忙碌周末留下破碎排面。", "退货、迟到配送和缺货同时出现。恢复布局，不要乱掉分类。", "恢复排面并处理全部配送事件。", "突发"],
    ["健康促销", "今天生鲜和乳制品卖得更快。", "促销带来连续取货，顾客拿走商品后要及时补回。", "在顾客取货后恢复全部分类。", "精确"],
    ["烧烤周末", "酱料和饮料正在飞快出货。", "周末订单比预期更大，后面还有迟到的瓶装货。", "补齐烧烤相关分类，并接住迟到配送。", "繁忙"],
    ["假期返店", "第一车货绝不是最后一车。", "节后重新营业，补第一批货时还要给第二波留空间。", "两批到货后仍完成全部分类。", "拥挤"],
    ["主厨推荐", "精品商品带来精品压力。", "本地主厨带来客流，但供货商也夹进了错货。", "退回错货，并补齐所有标记排面。", "主厨"],
    ["生日订单潮", "派对订单一直在变。", "饮料先被拿空，随后又有临时补货。保持灵活，但别混排。", "接住迟到配送并完成全部分类。", "派对"],
    ["午夜必需品", "安静夜班也要恢复得漂亮。", "最后一位顾客打乱了整齐排面，把缺失商品补回原位。", "顾客取货后恢复全部排面。", "舒缓+"],
    ["高峰时刻", "配送压力和顾客压力同时到来。", "新货进店时顾客还在拿货，这是第一次完整高峰模拟。", "在双重动态事件中保持全部分类正确。", "专家"],
    ["街区节日前夜", "今晚整条街都来采购。", "先搭好庆典冷柜，再应对最后一笔临时订单。", "需求变化后仍完成整洁节日排面。", "高级"],
    ["终极补货夜", "三段忙班，一家满载商店。", "先搭稳基础，再接住最后配送，最后从夜末取货中恢复。", "完成三个阶段，让每一排货架都满排面。", "压轴"],
  ],
  pt: [
    ["Primeira Entrega", "Comece com uma fileira simples de bebidas.", "O caminhao da manha chegou. Leia as etiquetas e reponha cada bebida no lugar certo.", "Coloque todas as bebidas na prateleira BEBIDAS.", "Treino"],
    ["Basico do Corredor Frio", "Duas familias de produtos, um expositor limpo.", "Agora ha bebidas e laticinios. Leia as etiquetas antes de colocar qualquer item.", "Reponha BEBIDAS e LATICINIOS sem misturar as fileiras.", "Facil"],
    ["Correria de Frescos", "O pedido de hortifruti chegou cedo.", "Produtos frescos entram no corredor frio. Agrupe cada familia para o cliente entender de relance.", "Combine bebidas, laticinios e frescos com as prateleiras marcadas.", "Facil"],
    ["Reposicao do Almoco", "A fileira de refeicoes esta sumindo rapido.", "Os clientes do escritorio esvaziaram metade do expositor. Reponha antes da fila crescer.", "Complete as prateleiras marcadas e deixe cada fileira bem alinhada.", "Normal"],
    ["Sexta das Bebidas", "A procura do fim de semana comecou cedo.", "As bebidas estao saindo rapido e o expositor ficou cheio de buracos.", "Complete cada familia de produtos e recupere as fileiras de bebidas.", "Normal"],
    ["Entrega do Dia de Feira", "Muitos frescos chegam de uma vez.", "Frescos, laticinios e refeicoes vieram misturados. Separe antes de abastecer.", "Reponha cada categoria e esvazie a bandeja de entrega.", "Normal"],
    ["Onda da Tarde", "Pequenos buracos viram prateleiras vazias.", "A turma da escola continua levando produtos. Reponha rapido sem misturar categorias.", "Restaure todas as prateleiras marcadas.", "Normal"],
    ["Preparacao da Semana", "As refeicoes prontas dominam o expositor.", "Marmitas e essenciais gelados chegam juntos. Planeje fileiras estaveis.", "Complete as fileiras de refeicoes, laticinios e bebidas.", "Cheio"],
    ["Inspecao Surpresa", "O gerente esta passando pelo corredor.", "Nada de buracos aleatorios ou categorias misturadas.", "Complete todas as fileiras e deixe a bandeja vazia.", "Correria"],
    ["Meta do Primeiro Mes", "A loja finalmente encontrou o ritmo.", "Um mes inteiro de entregas levou voce ate aqui. Esta reposicao decide o turno de alta temporada.", "Complete todos os blocos de categoria e deixe o expositor cheio.", "Marco"],
    ["Recuperacao de Domingo", "O fim de semana deixou as fileiras quebradas.", "Devolucoes, estoque atrasado e faltas chegam juntos.", "Restaure o planograma e resolva todos os eventos de entrega.", "Surpresa"],
    ["Promocao Saudavel", "Frescos e laticinios saem mais rapido hoje.", "A promocao traz retiradas constantes. Reponha o que os clientes levam.", "Restaure todas as categorias apos as retiradas.", "Preciso"],
    ["Fim de Semana do Churrasco", "Molhos e bebidas estao voando.", "O pedido ficou maior que o esperado e mais garrafas ainda vao chegar.", "Reponha as categorias do churrasco e absorva a entrega tardia.", "Cheio"],
    ["Volta do Feriado", "O primeiro caminhao nao sera o ultimo.", "A loja reabriu. Deixe espaco para a segunda onda enquanto abastece a primeira.", "Complete todas as categorias depois das duas entregas.", "Lotado"],
    ["Escolhas do Chef", "Estoque premium, pressao premium.", "Um chef local trouxe clientes, mas o fornecedor tambem mandou um item errado.", "Devolva a entrega errada e complete as fileiras marcadas.", "Chef"],
    ["Correria de Aniversario", "Os pedidos da festa continuam mudando.", "As bebidas saem primeiro e depois chega estoque extra.", "Absorva a entrega tardia e complete todas as categorias.", "Festa"],
    ["Essenciais da Madrugada", "Um turno calmo ainda precisa de recuperacao perfeita.", "Um cliente tardio quebrou o arranjo. Reponha o produto que falta.", "Restaure todas as fileiras depois da retirada.", "Zen+"],
    ["Horario de Pico", "Pressao de entrega e de clientes ao mesmo tempo.", "Novo estoque chega enquanto os clientes continuam retirando produtos.", "Mantenha todas as categorias corretas durante os dois eventos.", "Especialista"],
    ["Vespera do Festival", "O bairro inteiro compra hoje.", "Monte o expositor da festa e depois recupere um ultimo pedido urgente.", "Termine um planograma limpo depois da mudanca da demanda.", "Premium"],
    ["Grande Noite de Reposicao", "Tres turnos. Uma loja lotada.", "Monte a base, absorva a ultima entrega e recupere a retirada final.", "Complete os tres turnos e deixe cada fileira cheia.", "Vitrine"],
  ],
};

function categoryFor(item) {
  return CATEGORY_BY_IMAGE[item?.image] || "groceries";
}

function takeRoster(level, images) {
  const pool = [...(level.items || [])];
  const picked = [];
  for (const image of images) {
    const index = pool.findIndex((item) => item.image === image);
    if (index < 0) continue;
    const [item] = pool.splice(index, 1);
    picked.push({
      ...structuredClone(item),
      fixed: false,
      slot: undefined,
      col: undefined,
      row: undefined,
      layer: undefined,
    });
  }
  return picked;
}

function cleanRestockItem(item) {
  const category = categoryFor(item);
  const likes = (item.prefs?.likesNeighbors || []).filter((image) => CATEGORY_BY_IMAGE[image] === category);
  return {
    ...item,
    size: [1, 1],
    prefs: {
      category,
      ...(likes.length ? { likesNeighbors: likes } : {}),
    },
  };
}

function positionTray(items) {
  const movable = items.filter((item) => !item.fixed);
  const rowSize = Math.min(4, Math.max(1, Math.ceil(movable.length / 2)));
  movable.forEach((item, index) => {
    const row = Math.floor(index / rowSize);
    const rowItems = movable.slice(row * rowSize, (row + 1) * rowSize);
    const local = index - row * rowSize;
    const gap = rowItems.length <= 3 ? 132 : 112;
    const start = 375 - ((rowItems.length - 1) * gap) / 2;
    item.trayX = Math.round(start + local * gap);
    item.trayY = row === 0 ? 950 : 1082;
  });
}

function slotTierMap(slots) {
  const ys = [...new Set(slots.map((slot) => Math.round(slot.y)))].sort((a, b) => a - b);
  return new Map(ys.map((y, index) => [y, index]));
}

function buildPlanogram(level) {
  const slots = structuredClone(level.slots || []);
  const tierMap = slotTierMap(slots);
  for (const slot of slots) {
    slot.zone = "shelf";
    slot.allow = [...ALL_TAGS];
    slot.rows = 1;
    slot.stackLayers = 1;
    slot.category = undefined;
    slot.empty = true;
    slot.tier = tierMap.get(Math.round(slot.y)) ?? 0;
  }

  const byCategory = new Map();
  for (const item of level.items || []) {
    const category = item.prefs?.category || categoryFor(item);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(item);
  }

  const categories = CATEGORY_ORDER.filter((category) => byCategory.has(category));
  let slotIndex = 0;
  const planogram = [];

  for (const category of categories) {
    const items = [...byCategory.get(category)].sort((a, b) => Number(!!b.fixed) - Number(!!a.fixed));
    for (let offset = 0; offset < items.length; offset += 2) {
      const chunk = items.slice(offset, offset + 2);
      const slot = slots[slotIndex++];
      if (!slot) break;
      slot.category = category;
      slot.empty = false;
      slot.cols = Math.max(1, chunk.length);
      planogram.push({ slotId: slot.id, category, products: chunk.map((item) => item.image) });
      chunk.forEach((item, col) => {
        if (!item.fixed) return;
        item.slot = slot.id;
        item.col = col;
        item.row = 0;
        item.layer = 0;
      });
    }
  }

  return { slots, planogram };
}

function patchCopy(level, index) {
  const pt = STORY.pt[index];
  level.theme = {
    ...(level.theme || {}),
    key: "restock-cooler",
    title: pt[0],
    subtitle: pt[1],
  };
  level.copy = {
    ...(level.copy || {}),
    intro: pt[2],
    goal: pt[3],
    difficulty: pt[4],
    successTag: "CORREDOR PRONTO",
    successTitle: "Reposicao concluida!",
    successBody: "Prateleiras alinhadas e prontas para os clientes.",
  };

  for (const locale of ["en", "cn"]) {
    const entry = STORY[locale][index];
    CAMPAIGN_I18N[locale] = { ...(CAMPAIGN_I18N[locale] || {}) };
    CAMPAIGN_I18N[locale][level.id] = {
      ...(CAMPAIGN_I18N[locale][level.id] || {}),
      title: entry[0],
      subtitle: entry[1],
      intro: entry[2],
      goal: entry[3],
      difficulty: entry[4],
    };
  }
}

function patchUi() {
  const categoryNames = {
    en: { beverages: "Drinks", dairy: "Dairy", fresh: "Fresh", meals: "Ready meals", sauces: "Sauces", groceries: "Groceries" },
    cn: { beverages: "饮料", dairy: "乳制品", fresh: "生鲜", meals: "即食", sauces: "酱料", groceries: "杂货" },
    pt: { beverages: "Bebidas", dairy: "Laticinios", fresh: "Frescos", meals: "Refeicoes", sauces: "Molhos", groceries: "Mercado" },
  };

  for (const locale of ["en", "cn", "pt"]) {
    const ui = UI[locale];
    if (!ui) continue;
    ui.shelfCategory = { ...(ui.shelfCategory || {}), ...categoryNames[locale] };
    ui.dragHint = locale === "cn"
      ? "把商品补到标签对应的货架。"
      : locale === "pt"
        ? "Reponha cada produto na prateleira marcada."
        : "Restock each product on its labeled shelf.";
    ui.goalDefault = locale === "cn"
      ? "按分类标签完成全部补货。"
      : locale === "pt"
        ? "Complete a reposicao por categoria."
        : "Complete every labeled shelf.";
    ui.successTag = locale === "cn" ? "补货完成" : locale === "pt" ? "CORREDOR PRONTO" : "AISLE READY";
    ui.successTitle = locale === "cn" ? "排面补齐！" : locale === "pt" ? "Reposicao concluida!" : "Restock complete!";
    ui.successBody = locale === "cn"
      ? "分类清楚，排面整齐，可以迎客了。"
      : locale === "pt"
        ? "Fileiras alinhadas e prontas para os clientes."
        : "Every row is faced up and ready for shoppers.";
    if (ui.nav) {
      ui.nav.fridgeType = locale === "cn" ? "冷柜补货" : locale === "pt" ? "Corredor frio" : "Cold aisle";
      ui.nav.pantryType = locale === "cn" ? "常温货架" : locale === "pt" ? "Prateleiras" : "Dry aisle";
      ui.nav.tagline = locale === "cn" ? "到货、补货、迎接高峰。" : locale === "pt" ? "Receba, reponha, encare a correria." : "Deliveries in. Shelves full. Rush ready.";
    }
    if (ui.help) {
      ui.help.fridgeTitle = locale === "cn" ? "冷柜补货" : locale === "pt" ? "Reposicao do corredor frio" : "Cold aisle restock";
      ui.help.fridgeBody = locale === "cn"
        ? "把送货托盘里的商品拖到分类标签对应的货架。补满整排会获得额外奖励，后期还要处理迟到配送、顾客取货和错送商品。"
        : locale === "pt"
          ? "Arraste os produtos da entrega para a prateleira da categoria correta. Complete fileiras para ganhar bonus e depois lide com entregas tardias, retiradas de clientes e itens errados."
          : "Drag delivery stock to the shelf with the matching category label. Complete full rows for bonuses, then handle late deliveries, customer pickups and supplier mistakes.";
    }
  }
}

function patchChapters() {
  const chapters = {
    ch1: {
      en: { kicker: "Chapter 1", title: "First Shift", body: "Grandma gives you the morning delivery list and one cold aisle to keep full. Learn the labels, face the rows, and open on time.", cta: "Start the shift" },
      cn: { kicker: "第一章", title: "第一班岗", body: "外婆把早班到货单交给你。先守住一条冷柜通道：认标签、补排面、准时开门。", cta: "开始早班" },
      pt: { kicker: "Capitulo 1", title: "Primeiro Turno", body: "A Vovo entrega a lista da manha e um corredor frio para manter cheio. Leia as etiquetas e abra a loja no horario.", cta: "Comecar o turno" },
    },
    ch2: {
      en: { kicker: "Chapter 2", title: "The Store Gets Busy", body: "More shoppers means more gaps. Deliveries grow, categories multiply, and clean rows start to matter.", cta: "Take the rush" },
      cn: { kicker: "第二章", title: "客流起来了", body: "顾客越来越多，缺口出现得更快。到货变大、分类变多，整排管理开始真正重要。", cta: "迎接高峰" },
      pt: { kicker: "Capitulo 2", title: "A Loja Enche", body: "Mais clientes significam mais faltas. As entregas crescem e as fileiras limpas passam a importar de verdade.", cta: "Encarar a correria" },
    },
    ch3: {
      en: { kicker: "Chapter 3", title: "Rush Season", body: "Late trucks, pickups and supplier mistakes turn restocking into live problem-solving.", cta: "Run the aisle" },
      cn: { kicker: "第三章", title: "旺季来临", body: "迟到货车、顾客取货和供货商错单，让补货变成真正的现场应对。", cta: "守住通道" },
      pt: { kicker: "Capitulo 3", title: "Alta Temporada", body: "Caminhoes atrasados, retiradas e erros de fornecedor transformam reposicao em decisao ao vivo.", cta: "Comandar o corredor" },
    },
    ch4: {
      en: { kicker: "Chapter 4", title: "Neighborhood Favorite", body: "The little store is now part of the neighborhood routine. Festival week will test every shelf you manage.", cta: "Open for festival week" },
      cn: { kicker: "第四章", title: "街坊常去的小店", body: "这家小店已经成了街区日常的一部分。节日周会考验你管理的每一排货架。", cta: "开启节日周" },
      pt: { kicker: "Capitulo 4", title: "Favorita do Bairro", body: "A lojinha virou parte da rotina do bairro. A semana do festival vai testar cada fileira que voce cuida.", cta: "Abrir para o festival" },
    },
  };

  for (const chapter of CAMPAIGN_CHAPTERS) {
    const copy = chapters[chapter.id];
    if (copy) Object.assign(chapter, copy);
  }

  Object.assign(CAMPAIGN_FINALE, {
    id: "season-1-restock-finale",
    en: { kicker: "Season Complete", title: "The Aisles Stay Full", body: "Festival night winds down. Grandma looks across the clean rows and hands you the stockroom key. Tomorrow brings a new aisle, new suppliers and a much bigger store.", cta: "Keep the store moving" },
    cn: { kicker: "本篇完成", title: "货架继续满着", body: "节日夜渐渐散场。外婆看着整齐排面，把仓库钥匙交给你。明天会有新通道、新供货商，还有更大的店。", cta: "继续营业" },
    pt: { kicker: "Temporada Concluida", title: "Os Corredores Continuam Cheios", body: "A noite do festival termina. A Vovo olha as fileiras limpas e entrega a chave do estoque. Amanha chegam novos corredores, fornecedores e uma loja maior.", cta: "Manter a loja em movimento" },
  });
}

export function applySupermarketRestockPolish() {
  if (applied) return;
  applied = true;

  patchUi();
  patchChapters();

  let fridgeIndex = 0;
  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (!level?.id?.startsWith("fridge-br-")) continue;

    if (EARLY_ROSTERS[level.id]) {
      level.items = takeRoster(level, EARLY_ROSTERS[level.id]);
    }

    level.items = (level.items || []).map((item) => cleanRestockItem(item));
    positionTray(level.items);

    const layout = buildPlanogram(level);
    level.slots = layout.slots;
    level.planogram = layout.planogram;
    level.fronts = [];
    level.objective = { type: "restock-planogram", categories: [...new Set(level.items.map((item) => item.prefs.category))] };
    level.revision = Math.max(30, Number(level.revision || 1));

    patchCopy(level, fridgeIndex);
    fridgeIndex += 1;
  }
}
