import { CAMPAIGN_I18N } from "../i18n/campaign.js";
import { applyBonusChallengePolish } from "./bonusChallengePolish.js";
import { applyMidCampaignEventPolish } from "./midCampaignEventPolish.js";
import "./skipSafety.css";

let applied = false;

const EN = {
  "fridge-br-1": {
    title: "First Cold Cabinet",
    subtitle: "Four drinks. One clear lesson.",
    intro: "Start simple: move the four drinks from the crate to the right-side door rack.",
    goal: "Place all 4 drinks on the right-side door rack.",
    difficulty: "Cozy",
  },
  "fridge-br-2": {
    title: "Breakfast Restock",
    subtitle: "Shelves for food, rack for drinks.",
    intro: "Breakfast stock is mixed together. Keep bread and cheese on the open shelves; move drinks and sauces to the rack.",
    goal: "Stock bread and cheese on shelves, then place drinks and sauces on the right rack.",
    difficulty: "Gentle",
  },
  "fridge-br-3": {
    title: "Fresh Delivery",
    subtitle: "Produce low, drinks to the side.",
    intro: "A fresh delivery arrived with vegetables and drinks. Sort each group before the cabinet gets crowded.",
    goal: "Put cold vegetables in the lower cold spots, tomato on a shelf, and drinks on the right rack.",
    difficulty: "Medium",
  },
  "fridge-br-4": {
    title: "Fruit & Greens",
    subtitle: "Cold produce needs a clean plan.",
    intro: "Watermelon, lettuce and strawberries take different kinds of space. Place the food first, then finish the drink rack.",
    goal: "Place produce in its proper shelf or cold area, then move drinks and ketchup to the right rack.",
    difficulty: "Tight",
  },
  "fridge-br-5": {
    title: "Neat Facings",
    subtitle: "Build a clean drink row.",
    intro: "The cabinet is filling up. Keep bulky food on shelves and use the side rack for the drink line.",
    goal: "Build a clean drink row, keep cheese on a shelf, watermelon high, and apple in the drawer.",
    difficulty: "Full",
  },
  "fridge-br-6": {
    title: "Delivery Morning",
    subtitle: "Meals, dairy and drinks.",
    intro: "The ready meal needs a cold lower spot while drinks and sauce belong on the side rack.",
    goal: "Chill the meal box, shelve eggs and cheese, and place drinks and mustard on the right rack.",
    difficulty: "Medium",
  },
  "fridge-br-7": {
    title: "Afternoon Treats",
    subtitle: "Cake stays visible.",
    intro: "Keep the cake easy to see and stop bottles from consuming the food shelves.",
    goal: "Place cake and cheese on shelves; move milk, soda, juice and mustard to the right rack.",
    difficulty: "Medium",
  },
  "fridge-br-8": {
    title: "Week Prep",
    subtitle: "The middle is already busy.",
    intro: "With meal boxes occupying the center, every remaining item needs a deliberate home.",
    goal: "Keep watermelon high, cheese on a shelf, and all drinks and sauces on the right rack.",
    difficulty: "Cramped",
  },
  "fridge-br-9": {
    title: "Rush Restock",
    subtitle: "Fast, but still organized.",
    intro: "A small rush order is easy only if bottles leave the food shelves clear.",
    goal: "Put cake and cheese on shelves, then move soda, milk and mustard to the right rack.",
    difficulty: "Rush",
  },
  "fridge-br-10": {
    title: "First Month Done",
    subtitle: "Use every zone with intent.",
    intro: "This cabinet now tests the full pattern: drawer, shelf, cold spot, high shelf and side rack.",
    goal: "Apple to the drawer, meal box to cold storage, cheese to a shelf, watermelon high, soda to the rack.",
    difficulty: "Hard",
  },
};

export function applyEarlyCampaignCopyPolish() {
  if (applied) return;
  applied = true;
  CAMPAIGN_I18N.en = { ...CAMPAIGN_I18N.en, ...EN };
  applyBonusChallengePolish();
  applyMidCampaignEventPolish();
}
