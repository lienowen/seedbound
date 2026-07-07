import { CAMPAIGN_I18N } from "../i18n/campaign.js";
import { applyBonusChallengePolish } from "./bonusChallengePolish.js";
import { applyChapterContinuityPolish } from "./chapterContinuityPolish.js";
import { applyMidCampaignEventPolish } from "./midCampaignEventPolish.js";
import "./skipSafety.css";

let applied = false;

const EN = {
  "fridge-br-1": { title: "First Cold Cabinet", subtitle: "Four drinks. One clear lesson.", intro: "Start simple: move the four drinks from the crate to the right-side door rack.", goal: "Place all 4 drinks on the right-side door rack.", difficulty: "Cozy" },
  "fridge-br-2": { title: "Breakfast Restock", subtitle: "Shelves for food, rack for drinks.", intro: "Breakfast stock is mixed together. Keep bread and cheese on the open shelves; move drinks and sauces to the rack.", goal: "Stock bread and cheese on shelves, then place drinks and sauces on the right rack.", difficulty: "Gentle" },
  "fridge-br-3": { title: "Fresh Delivery", subtitle: "Produce low, drinks to the side.", intro: "A fresh delivery arrived with vegetables and drinks. Sort each group before the cabinet gets crowded.", goal: "Put cold vegetables in the lower cold spots, tomato on a shelf, and drinks on the right rack.", difficulty: "Medium" },
  "fridge-br-4": { title: "Fruit & Greens", subtitle: "Cold produce needs a clean plan.", intro: "Watermelon, lettuce and strawberries take different kinds of space. Place the food first, then finish the drink rack.", goal: "Place produce in its proper shelf or cold area, then move drinks and ketchup to the right rack.", difficulty: "Tight" },
  "fridge-br-5": { title: "Neat Facings", subtitle: "Build a clean drink row.", intro: "The cabinet is filling up. Keep bulky food on shelves and use the side rack for the drink line.", goal: "Build a clean drink row, keep cheese on a shelf, watermelon high, and apple in the drawer.", difficulty: "Full" },
  "fridge-br-6": { title: "Delivery Morning", subtitle: "Meals, dairy and drinks.", intro: "The ready meal needs a cold lower spot while drinks and sauce belong on the side rack.", goal: "Chill the meal box, shelve eggs and cheese, and place drinks and mustard on the right rack.", difficulty: "Medium" },
  "fridge-br-7": { title: "Afternoon Treats", subtitle: "Cake stays visible.", intro: "Keep the cake easy to see and stop bottles from consuming the food shelves.", goal: "Place cake and cheese on shelves; move milk, soda, juice and mustard to the right rack.", difficulty: "Medium" },
  "fridge-br-8": { title: "Week Prep", subtitle: "The middle is already busy.", intro: "With meal boxes occupying the center, every remaining item needs a deliberate home.", goal: "Keep watermelon high, cheese on a shelf, and all drinks and sauces on the right rack.", difficulty: "Cramped" },
  "fridge-br-9": { title: "Rush Restock", subtitle: "Fast, but still organized.", intro: "A small rush order is easy only if bottles leave the food shelves clear.", goal: "Put cake and cheese on shelves, then move soda, milk and mustard to the right rack.", difficulty: "Rush" },
  "fridge-br-10": { title: "First Month Done", subtitle: "Use every zone with intent.", intro: "This cabinet now tests the full pattern: drawer, shelf, cold spot, high shelf and side rack.", goal: "Apple to the drawer, meal box to cold storage, cheese to a shelf, watermelon high, soda to the rack.", difficulty: "Hard" },

  "fridge-br-11": { title: "Sunday Afterparty", subtitle: "Not every delivery belongs here.", intro: "Clear the leftovers, watch for the wrong delivery, and stay flexible when late stock arrives.", goal: "Return the red-tagged mistake, then organize the real stock as the delivery changes.", difficulty: "Surprise" },
  "fridge-br-12": { title: "Healthy Reset", subtitle: "A customer may interrupt your perfect plan.", intro: "Build a clean healthy fridge, but leave yourself room to recover when one item is taken.", goal: "Sort dairy and produce correctly, then restore anything a customer removes.", difficulty: "Precise" },
  "fridge-br-13": { title: "BBQ Tomorrow", subtitle: "Sauces first, then the restock hits.", intro: "Keep sauces and drinks easy to reach. More stock will arrive after you get started.", goal: "Build an accessible BBQ setup and absorb the late bottle delivery without blocking yourself.", difficulty: "Busy" },
  "fridge-br-14": { title: "Back From Vacation", subtitle: "One shopping bag is never the whole story.", intro: "Start with the first load, then re-plan when the second bag arrives.", goal: "Use the space efficiently enough to absorb the surprise second wave.", difficulty: "Packed" },
  "fridge-br-15": { title: "Gourmet Cabinet", subtitle: "Premium ingredients, supplier mistakes.", intro: "Keep the display clean, return the wrong delivery, and recover from the chef's request.", goal: "Protect the premium layout while handling both the supplier mistake and the re-stock request.", difficulty: "Chef" },
  "fridge-br-16": { title: "House Party", subtitle: "Guests always bring more than expected.", intro: "Build the party fridge, then make room when extra drinks arrive.", goal: "Keep food accessible and absorb the late party delivery without losing the layout.", difficulty: "Party" },
  "fridge-br-17": { title: "Midnight Essentials", subtitle: "Small fridge, real interruption.", intro: "A calm minimal layout can still be disrupted by one midnight snack.", goal: "Place every essential well, then restore the item taken from your arrangement.", difficulty: "Zen+" },
  "fridge-br-18": { title: "Everything at Once", subtitle: "Restock pressure and customer pressure together.", intro: "This is the first true double-event level: new stock arrives and a customer changes the board.", goal: "Keep the fridge solvable through both the rush delivery and the customer pickup.", difficulty: "Expert" },
  "fridge-br-19": { title: "New Year's Eve", subtitle: "The final customer order changes the plan.", intro: "Build a premium party fridge, then recover cleanly from the last-minute order.", goal: "Finish an organized celebration layout after the customer removes one item.", difficulty: "Premium" },
  "fridge-br-20": { title: "Perfect Fridge Finale", subtitle: "Three phases. One final cabinet.", intro: "Phase 1 builds the base. Phase 2 brings the last delivery. Phase 3 forces one final recovery.", goal: "Survive all three phases and close the fridge with every real item correctly settled.", difficulty: "Boss" },
};

export function applyEarlyCampaignCopyPolish() {
  if (applied) return;
  applied = true;
  CAMPAIGN_I18N.en = { ...CAMPAIGN_I18N.en, ...EN };
  applyBonusChallengePolish();
  applyMidCampaignEventPolish();
  applyChapterContinuityPolish();
}
