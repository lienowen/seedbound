import { CAMPAIGN_CHAPTERS, CAMPAIGN_FINALE, CAMPAIGN_I18N } from "../i18n/campaign.js";
import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

// Keep the release campaign feeling complete without closing the world forever.
// These beats connect the existing levels into one shop story and turn level 20
// into the climax of the current season, leaving clean hooks for future areas.
const STORY_OVERRIDES = {
  en: {
    "fridge-br-10": {
      title: "First Month Done",
      subtitle: "The regulars are back.",
      intro: "You kept Grandma's cooler running for a full month. Now the supplier trusts you with bigger, messier orders.",
      goal: "Use every zone with intent and prove the shop is ready for the busy season.",
      difficulty: "Milestone",
    },
    "fridge-br-11": {
      title: "Sunday Afterparty",
      subtitle: "Success leaves a mess.",
      intro: "Your first neighborhood celebration is over. Clear the leftovers, reject the wrong delivery, and adapt when late stock arrives.",
      goal: "Return the red-tagged mistake, then keep the real stock organized through the late delivery.",
      difficulty: "Surprise",
    },
    "fridge-br-15": {
      title: "Chef's Recommendation",
      subtitle: "Word has reached the restaurants.",
      intro: "A local chef recommends Grandma's shop. Premium stock arrives with a supplier mistake and a last-minute request.",
      goal: "Protect the premium layout while handling the bad delivery and the chef's re-stock request.",
      difficulty: "Chef",
    },
    "fridge-br-16": {
      title: "Weekend Party Rush",
      subtitle: "The recommendation spreads.",
      intro: "The chef's post brings a wave of party orders. Build a stable fridge, then make room when guests bring extra drinks.",
      goal: "Keep food accessible and absorb the late party delivery without losing the plan.",
      difficulty: "Party",
    },
    "fridge-br-19": {
      title: "Festival Eve",
      subtitle: "The whole street is counting on you.",
      intro: "Tomorrow is the neighborhood festival. Build the celebration fridge, then recover from one last-minute customer order.",
      goal: "Finish a clean festival layout after the customer changes the plan.",
      difficulty: "Premium",
    },
    "fridge-br-20": {
      title: "Grand Reopening Night",
      subtitle: "Three shifts. One packed shop.",
      intro: "The festival crowd is here. First build a stable base, then absorb the final delivery, then recover from one last pickup.",
      goal: "Complete all three shifts and close the current season with every real item correctly settled.",
      difficulty: "Showcase",
    },
  },
  cn: {
    "fridge-br-10": {
      title: "满月营业",
      subtitle: "老顾客真的回来了。",
      intro: "你让外婆的冷柜稳稳运转了整整一个月。供货商开始放心把更大、更乱的订单交给你。",
      goal: "有计划地用好每个区域，证明小店已经准备好迎接旺季。",
      difficulty: "里程碑",
    },
    "fridge-br-11": {
      title: "周日派对之后",
      subtitle: "热闹过后总会留下一地狼藉。",
      intro: "第一次街坊聚会结束了。清理剩货、退回错送商品，还要应付迟到的补货。",
      goal: "先退回红标错货，再在追加配送中保持真正的商品井然有序。",
      difficulty: "突发",
    },
    "fridge-br-15": {
      title: "主厨推荐",
      subtitle: "名声传到了餐馆。",
      intro: "一位本地主厨推荐了外婆的小店。精品货到了，却夹着错货和临时加单。",
      goal: "守住精品陈列，同时处理错送商品和主厨的补货请求。",
      difficulty: "主厨",
    },
    "fridge-br-16": {
      title: "周末派对潮",
      subtitle: "推荐开始发酵。",
      intro: "主厨的推荐带来一波派对订单。先搭稳布局，再给客人临时带来的饮料腾位置。",
      goal: "保持食品顺手可取，并在追加饮料到来后仍维持整体布局。",
      difficulty: "派对",
    },
    "fridge-br-19": {
      title: "街区节日前夜",
      subtitle: "整条街都在等你。",
      intro: "明天就是街区节日。先备好庆典冷柜，再处理最后一笔临时顾客订单。",
      goal: "顾客打乱计划后，仍完成一台整洁的节日冷柜。",
      difficulty: "高级",
    },
    "fridge-br-20": {
      title: "重新开业之夜",
      subtitle: "三段忙班，一家满载小店。",
      intro: "节日人潮来了。先搭稳基础，再接住最后一批配送，最后从一次临时取货中恢复。",
      goal: "完成三个阶段，让所有真实商品正确归位，为当前篇章漂亮收官。",
      difficulty: "压轴",
    },
  },
};

const PT_OVERRIDES = {
  "fridge-br-10": {
    title: "Primeiro Mes Completo",
    subtitle: "Os fregueses voltaram.",
    intro: "Voce manteve a geladeira da Vovo funcionando por um mes inteiro. Agora o fornecedor confia pedidos maiores a voce.",
    goal: "Use cada zona com intencao e prove que a loja esta pronta para a alta temporada.",
    difficulty: "Marco",
  },
  "fridge-br-11": {
    title: "Depois da Festa",
    subtitle: "Sucesso tambem deixa bagunca.",
    intro: "A primeira festa do bairro acabou. Limpe as sobras, devolva a entrega errada e adapte-se ao estoque atrasado.",
    goal: "Devolva o item com etiqueta vermelha e organize o estoque real quando a nova entrega chegar.",
    difficulty: "Surpresa",
  },
  "fridge-br-15": {
    title: "Recomendacao do Chef",
    subtitle: "A fama chegou aos restaurantes.",
    intro: "Um chef local recomendou a loja da Vovo. Chegam produtos premium, um erro do fornecedor e um pedido urgente.",
    goal: "Proteja a vitrine premium enquanto resolve a entrega errada e o novo pedido do chef.",
    difficulty: "Chef",
  },
  "fridge-br-16": {
    title: "Correria de Festa",
    subtitle: "A recomendacao se espalhou.",
    intro: "A postagem do chef trouxe pedidos de festa. Monte uma base estavel e abra espaco para as bebidas extras.",
    goal: "Mantenha a comida acessivel e absorva a entrega tardia sem perder o plano.",
    difficulty: "Festa",
  },
  "fridge-br-19": {
    title: "Vespera do Festival",
    subtitle: "A rua inteira conta com voce.",
    intro: "Amanha e o festival do bairro. Prepare a geladeira e recupere o plano depois de um ultimo pedido urgente.",
    goal: "Termine uma vitrine de festa organizada mesmo depois da mudanca do cliente.",
    difficulty: "Premium",
  },
  "fridge-br-20": {
    title: "Noite da Reinauguracao",
    subtitle: "Tres turnos. Uma loja lotada.",
    intro: "A multidao do festival chegou. Monte a base, absorva a ultima entrega e recupere-se de uma retirada final.",
    goal: "Complete os tres turnos e feche a temporada atual com cada item real no lugar certo.",
    difficulty: "Vitrine",
  },
};

const PT_CHAPTERS = {
  ch1: {
    kicker: "Capitulo 1",
    title: "Assumindo a Loja",
    body: "A Vovo entregou a voce as chaves da pequena mercearia do bairro. Comece pela geladeira de vidro e pelas primeiras prateleiras.",
    cta: "Abrir a loja",
  },
  ch2: {
    kicker: "Capitulo 2",
    title: "A Noticia se Espalha",
    body: "A rua inteira ficou sabendo. Os fregueses antigos estao voltando com sacolas na mao. Mantenha a geladeira e os corredores abastecidos.",
    cta: "Receber os fregueses",
  },
  ch3: {
    kicker: "Capitulo 3",
    title: "Temporada Cheia",
    body: "As semanas mais movimentadas do ano chegaram. As entregas se acumulam na porta: abasteca rapido, mas sem perder a organizacao.",
    cta: "Maos a obra",
  },
  ch4: {
    kicker: "Capitulo 4",
    title: "A Loja do Bairro",
    body: "A lojinha virou ponto de encontro da rua. O festival se aproxima: aguente a correria e mostre que esta pronta para o proximo passo.",
    cta: "Encarar a noite",
  },
};

const CH4 = {
  en: {
    kicker: "Chapter 4",
    title: "The Neighborhood Shop",
    body: "Grandma's little store has become a meeting point for the whole street. The festival is coming: survive the rush and prove the shop is ready for whatever opens next.",
    cta: "Take on the night",
  },
  cn: {
    kicker: "第四章",
    title: "街坊的小店",
    body: "外婆的小店已经成了整条街的碰面地点。街区节日将至——扛住高峰，也证明这家店已经准备好迈向下一步。",
    cta: "迎接忙夜",
  },
};

const SEASON_FINALE = {
  id: "season-1-finale",
  en: {
    kicker: "Season Complete",
    title: "The Lights Stay On",
    body: "The festival winds down. Grandma walks through the busy little shop, sees the shelves full and the cooler glowing, and smiles. You did not finish the story — you gave the store a future. On the counter sits an unopened crate and an old key to the back room.",
    cta: "Keep the shop open",
  },
  cn: {
    kicker: "本篇完成",
    title: "小店的灯继续亮着",
    body: "街区节日渐渐散场。外婆走进忙碌的小店，看见满满的货架和亮着灯的冷柜，欣慰地笑了。你不是把故事做完了，而是让这家店有了未来。柜台上还放着一只未开的货箱，以及一把通往后屋的旧钥匙。",
    cta: "继续营业",
  },
  pt: {
    kicker: "Temporada Concluida",
    title: "As Luzes Continuam Acesas",
    body: "O festival termina devagar. A Vovo entra na lojinha cheia, ve as prateleiras abastecidas e a geladeira brilhando, e sorri. Voce nao terminou a historia: deu um futuro a loja. No balcao ainda ha uma caixa fechada e uma chave antiga da sala dos fundos.",
    cta: "Manter a loja aberta",
  },
};

function patchLocalizedCopy(locale, overrides) {
  CAMPAIGN_I18N[locale] = { ...(CAMPAIGN_I18N[locale] || {}) };
  for (const [levelId, copy] of Object.entries(overrides)) {
    CAMPAIGN_I18N[locale][levelId] = {
      ...(CAMPAIGN_I18N[locale][levelId] || {}),
      ...copy,
    };
  }
}

function patchPortugueseLevels() {
  for (const [levelId, copy] of Object.entries(PT_OVERRIDES)) {
    const level = FRIDGE_BR_CAMPAIGN.find((entry) => entry.id === levelId);
    if (!level) continue;
    level.theme = { ...(level.theme || {}), title: copy.title, subtitle: copy.subtitle };
    level.copy = {
      ...(level.copy || {}),
      intro: copy.intro,
      goal: copy.goal,
      difficulty: copy.difficulty,
    };
  }
}

function patchChapters() {
  for (const chapter of CAMPAIGN_CHAPTERS) {
    if (PT_CHAPTERS[chapter.id]) chapter.pt = PT_CHAPTERS[chapter.id];
    if (chapter.id === "ch4") Object.assign(chapter, CH4);
  }
}

export function applyChapterContinuityPolish() {
  if (applied) return;
  applied = true;

  patchLocalizedCopy("en", STORY_OVERRIDES.en);
  patchLocalizedCopy("cn", STORY_OVERRIDES.cn);
  patchPortugueseLevels();
  patchChapters();

  Object.assign(CAMPAIGN_FINALE, SEASON_FINALE);
}
