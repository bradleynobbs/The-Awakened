import sparkSkin from "../assets/store/spark-skin.png";
import luxeSkin from "../assets/store/luxe-skin.png";
import emberSkin from "../assets/store/ember-skin.png";
import cloudyCompanion from "../assets/store/cloudy-companion.png";
import surgeVfx from "../assets/store/surge-vfx.png";
import tropicalBg from "../assets/store/tropical-bg.png";

/**
 * The Item Shop's one live bundle (§9.51 — see DESIGN.md), built to
 * match a supplied "Summer Surge Bundle" mockup exactly: same title,
 * tagline, pricing, and the same six bundle contents, using the real
 * Spark/Luxe/Ember/Cloudy art the user supplied rather than any
 * invented skin. Deliberately the *only* bundle here — the brief that
 * introduced this screen asked for more (Daily Offers, a generic
 * Featured Skins grid, Currency Packs, a second "Featured Demigod
 * Bundles" section), but a later explicit instruction narrowed scope
 * to "don't add anything apart from things in the screenshot or the
 * images." Nothing below has a stat, a rarity, or a description that
 * isn't visible in that mockup.
 */
export interface StoreBundleItem {
  id: string;
  name: string;
  kicker: string;
  image: string;
}

export interface StoreBundle {
  id: string;
  badge: string;
  title: string[];
  tagline: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  items: StoreBundleItem[];
  featured: StoreBundleItem & { price: number };
}

export const SUMMER_SURGE_BUNDLE: StoreBundle = {
  id: "summer-surge",
  badge: "NEW!",
  title: ["SUMMER", "SURGE"],
  tagline: ["Ride the Tide.", "Rule the Storm."],
  price: 2800,
  originalPrice: 4200,
  discountPercent: 33,
  items: [
    { id: "spark-skin", name: "Spark", kicker: "SUMMER SKIN", image: sparkSkin },
    { id: "luxe-skin", name: "Luxe", kicker: "SUMMER SKIN", image: luxeSkin },
    { id: "ember-skin", name: "Ember", kicker: "SUMMER SKIN", image: emberSkin },
    { id: "cloudy-companion", name: "Cloudy", kicker: "COMPANION", image: cloudyCompanion },
    { id: "surge-vfx", name: "Surge", kicker: "VFX EFFECT", image: surgeVfx },
    { id: "tropical-bg", name: "Tropical", kicker: "LOBBY BACKGROUND", image: tropicalBg },
  ],
  featured: { id: "ember-skin-featured", name: "Ember", kicker: "SUMMER SKIN", image: emberSkin, price: 1200 },
};

/** Mock balance shown in the top bar, matching the mockup's "12,450" —
 * cosmetic only, same as everything else on this screen (see
 * Store.tsx's purchase toast). */
export const MOCK_SPARK_BALANCE = 12450;

export const STORE_TABS = ["Featured", "Skins", "Bundles", "Items", "Currency"] as const;
export type StoreTab = (typeof STORE_TABS)[number];
