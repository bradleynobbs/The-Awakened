import type { Element, HeroId, Role } from "../engine/types";
import mageIcon from "../assets/roles/mage.png";
import brawlerIcon from "../assets/roles/brawler.png";
import tankIcon from "../assets/roles/tank.png";
import speedsterIcon from "../assets/roles/speedster.png";
import rangerIcon from "../assets/roles/ranger.png";
import supportIcon from "../assets/roles/support.png";
import infernaPortrait from "../assets/heroes/inferna-portrait.png";
import mournPortrait from "../assets/heroes/mourn-portrait.png";
import kairoPortrait from "../assets/heroes/kairo-portrait.png";
import tydraPortrait from "../assets/heroes/tydra-portrait.png";
import torrentPortrait from "../assets/heroes/torrent-portrait.png";
import zeraPortrait from "../assets/heroes/zera-portrait.png";
import orinPortrait from "../assets/heroes/orin-portrait.png";
import kharosPortrait from "../assets/heroes/kharos-portrait.png";
import flintPortrait from "../assets/heroes/flint-portrait.png";
import erosalinaPortrait from "../assets/heroes/erosalina-portrait.png";
import runePortrait from "../assets/heroes/rune-portrait.png";
import ampPortrait from "../assets/heroes/amp-portrait.png";
import infernaCardArt from "../assets/heroes/inferna-card-art.png";
import mournCardArt from "../assets/heroes/mourn-card-art.png";
import kairoCardArt from "../assets/heroes/kairo-card-art.png";
import tydraCardArt from "../assets/heroes/tydra-card-art.png";
import torrentCardArt from "../assets/heroes/torrent-card-art.png";
import zeraCardArt from "../assets/heroes/zera-card-art.png";
import orinCardArt from "../assets/heroes/orin-card-art.png";
import kharosCardArt from "../assets/heroes/kharos-card-art.png";
import flintCardArt from "../assets/heroes/flint-card-art.png";
import erosalinaCardArt from "../assets/heroes/erosalina-card-art.png";
import runeCardArt from "../assets/heroes/rune-card-art.png";
import ampCardArt from "../assets/heroes/amp-card-art.png";

/** Cropped headshots for the roster panel (§9.19) — only exists for
 * heroes with real illustrated art (see REAL_ART in HeroSprite.tsx).
 * Heroes still on the shared vector chassis fall back to their role
 * icon on a plain element-colored disc (HeroPortrait in Battlefield.tsx). */
export const HERO_PORTRAIT: Partial<Record<HeroId, string>> = {
  "fire-mage": infernaPortrait,
  "undead-assassin": mournPortrait,
  "charm-gunslinger": kairoPortrait,
  "water-healer": tydraPortrait,
  torrent: torrentPortrait,
  zera: zeraPortrait,
  orin: orinPortrait,
  kharos: kharosPortrait,
  flint: flintPortrait,
  erosalina: erosalinaPortrait,
  rune: runePortrait,
  amp: ampPortrait,
};

/** Wider "chest and shoulders" crops for the trading-card design
 * (§9.30) — HERO_PORTRAIT above is a tight square headshot sized for
 * the roster panel's small circular avatar, too tight to fill a
 * card's entire upper half the way this design calls for. Cropped
 * fresh from the top of each hero's existing full-body sprite (not
 * new art — this project has no image-generation tool) at a width-
 * dependent height aimed at the card's upper-half aspect ratio, so
 * each hero needs only a little further cropping via object-fit:
 * cover rather than a drastic zoom. Same 12 heroes as HERO_PORTRAIT;
 * heroes without dedicated art keep the same role-icon-on-disc
 * fallback. */
export const HERO_CARD_ART: Partial<Record<HeroId, string>> = {
  "fire-mage": infernaCardArt,
  "undead-assassin": mournCardArt,
  "charm-gunslinger": kairoCardArt,
  "water-healer": tydraCardArt,
  torrent: torrentCardArt,
  zera: zeraCardArt,
  orin: orinCardArt,
  kharos: kharosCardArt,
  flint: flintCardArt,
  erosalina: erosalinaCardArt,
  rune: runeCardArt,
  amp: ampCardArt,
};

/** Illustrated role emblems (replacing the earlier emoji placeholders) —
 * matching metallic target-ring frames, one motif per role. */
export const ROLE_ICON: Record<Role, string> = {
  Mage: mageIcon,
  Brawler: brawlerIcon,
  Tank: tankIcon,
  Speedster: speedsterIcon,
  Ranger: rangerIcon,
  Support: supportIcon,
};

export const ELEMENT_COLOR: Record<Element, string> = {
  fire: "#e2582b",
  water: "#2f8fd6",
  spark: "#c9a13b",
  earth: "#5a7a4a",
  undead: "#6e5a72",
  charm: "#d6559e",
  spirit: "#7ecbc4",
};

export const ELEMENT_SYMBOL: Record<Element, string> = {
  fire: "\u{1F525}",
  water: "\u{1F4A7}",
  spark: "⚡",
  earth: "\u{1FAA8}",
  undead: "\u{1F480}",
  charm: "\u{1F498}",
  spirit: "\u{1F47B}",
};
