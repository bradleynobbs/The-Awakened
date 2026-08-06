import { useEffect, useState } from "react";
import { HERO_DEFINITIONS, HERO_LIST } from "../engine/heroes";
import type { Element, HeroDefinition, HeroId, Role } from "../engine/types";
import { DECK_SIZE, getDeck, saveDeck } from "../state/loadout";
import { HERO_PORTRAIT, ROLE_ICON } from "./heroVisuals";
import { DeckSlotCard } from "./DeckSlotCard";
import { HeroCollectionCard } from "./HeroCollectionCard";
import { HeroDetailPanel } from "./HeroDetailPanel";
import { SectionDivider } from "./SectionDivider";

interface DeckBuilderProps {
  onBack: () => void;
}

const ELEMENT_FILTERS: Element[] = ["fire", "water", "spark", "earth", "spirit", "undead", "charm"];
const ELEMENT_FILTER_ICON: Record<Element, string> = {
  fire: "🔥",
  water: "💧",
  spark: "⚡",
  earth: "🌿",
  spirit: "✨",
  undead: "💀",
  charm: "💗",
};
const ROLE_FILTERS: Role[] = ["Tank", "Support", "Mage", "Brawler", "Speedster", "Ranger"];

type SortMode = "name" | "role" | "element" | "hp";
const SORT_LABELS: Record<SortMode, string> = { name: "Name", role: "Role", element: "Element", hp: "HP" };
const SORT_CYCLE: SortMode[] = ["name", "role", "element", "hp"];

function sortHeroes(list: HeroDefinition[], mode: SortMode): HeroDefinition[] {
  const sorted = [...list];
  switch (mode) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "role":
      sorted.sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
      break;
    case "element":
      sorted.sort((a, b) => a.element.localeCompare(b.element) || a.name.localeCompare(b.name));
      break;
    case "hp":
      sorted.sort((a, b) => b.maxHp - a.maxHp || a.name.localeCompare(b.name));
      break;
  }
  return sorted;
}

/** Rebuilt to closely match a supplied mockup (§9.47 — see DESIGN.md):
 * a static "Pick 5 Demigods" heading (no live counter — the 5 slots
 * themselves already show progress) over a single un-scrolled row of
 * 5 deck slots, no Power Rating/Avg Cost/Synergy panel, an always-
 * visible element filter row under "Choose Your Demigods," and a
 * 2-column grid of full-art cards. Role filtering moved behind the
 * header's own Filter button (a small dropdown) since the mockup's
 * always-visible filter bar only ever shows elements. The persistent
 * 5-hero deck itself (state/loadout.ts) is unchanged from §9.46 — this
 * pass is a visual/interaction rebuild, not a data-model change. */
export function DeckBuilder({ onBack }: DeckBuilderProps) {
  const [deck, setDeck] = useState<HeroId[]>(() => getDeck());
  const [elementFilter, setElementFilter] = useState<Element | "all">("all");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [detailHeroId, setDetailHeroId] = useState<HeroId | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<HeroId | null>(null);

  useEffect(() => {
    saveDeck(deck);
  }, [deck]);

  /** Add/remove a hero from the deck. If the deck is already full and
   * this hero isn't in it, opens the replace picker instead of
   * mutating anything — the brief's "ask which Demigod to replace"
   * behavior for a 6th pick. */
  const attemptToggle = (heroId: HeroId) => {
    if (deck.includes(heroId)) {
      setDeck(deck.filter((id) => id !== heroId));
    } else if (deck.length < DECK_SIZE) {
      setDeck([...deck, heroId]);
    } else {
      setReplaceTarget(heroId);
    }
  };

  const cycleSort = () => {
    setSortMode(SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length]);
  };

  const visibleHeroes = sortHeroes(
    HERO_LIST.filter(
      (h) =>
        (elementFilter === "all" || h.element === elementFilter) &&
        (roleFilter === "all" || h.role === roleFilter),
    ),
    sortMode,
  );

  const detailHero = detailHeroId ? HERO_DEFINITIONS[detailHeroId] : null;
  const replaceHero = replaceTarget ? HERO_DEFINITIONS[replaceTarget] : null;

  return (
    <div className="screen-with-header deck-builder-screen">
      <div className="deck-builder-cosmic-fog" aria-hidden="true" />
      <div className="menu-particles" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="menu-particle" />
        ))}
      </div>

      <div className="screen-header deck-builder-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title font-display">Deck Builder</span>
        <button className="deck-builder-info-btn" onClick={() => setInfoOpen(true)} aria-label="How this works">
          ⓘ
        </button>
        <div className="screen-header-actions">
          <div className="deck-builder-filter-wrap">
            <button
              className={`deck-builder-tool-btn${roleFilterOpen ? " active" : ""}`}
              onClick={() => setRoleFilterOpen((v) => !v)}
            >
              ▽ Filter
            </button>
            {roleFilterOpen && (
              <>
                <button
                  className="dropdown-backdrop"
                  aria-label="Close filter"
                  onClick={() => setRoleFilterOpen(false)}
                />
                <div className="role-filter-dropdown">
                  <button
                    className={`role-filter-option${roleFilter === "all" ? " active" : ""}`}
                    onClick={() => {
                      setRoleFilter("all");
                      setRoleFilterOpen(false);
                    }}
                  >
                    All Roles
                  </button>
                  {ROLE_FILTERS.map((role) => (
                    <button
                      key={role}
                      className={`role-filter-option${roleFilter === role ? " active" : ""}`}
                      onClick={() => {
                        setRoleFilter(role);
                        setRoleFilterOpen(false);
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="deck-builder-tool-btn" onClick={cycleSort}>
            ⇕ {SORT_LABELS[sortMode]} ▾
          </button>
        </div>
      </div>

      <div className="deck-builder-body">
        <SectionDivider>Pick 5 Demigods</SectionDivider>
        <div className="deck-slot-row">
          {Array.from({ length: DECK_SIZE }, (_, i) => deck[i] ?? null).map((heroId, i) => (
            <DeckSlotCard
              key={heroId ?? `empty-${i}`}
              hero={heroId ? HERO_DEFINITIONS[heroId] : null}
              onClick={heroId ? () => attemptToggle(heroId) : undefined}
              onLongPress={heroId ? () => setDetailHeroId(heroId) : undefined}
            />
          ))}
        </div>

        <SectionDivider>Choose Your Demigods</SectionDivider>

        <div className="filter-chip-row element-filter-row">
          <button
            className={`filter-chip${elementFilter === "all" ? " active" : ""}`}
            onClick={() => setElementFilter("all")}
          >
            ◆ All
          </button>
          {ELEMENT_FILTERS.map((el) => (
            <button
              key={el}
              className={`filter-chip${elementFilter === el ? " active" : ""}`}
              onClick={() => setElementFilter(el)}
            >
              {ELEMENT_FILTER_ICON[el]} {el[0].toUpperCase() + el.slice(1)}
            </button>
          ))}
        </div>

        <div className="hero-collection-grid">
          {visibleHeroes.map((hero) => (
            <HeroCollectionCard
              key={hero.id}
              hero={hero}
              selected={deck.includes(hero.id)}
              onSelect={() => attemptToggle(hero.id)}
              onInfo={() => setDetailHeroId(hero.id)}
            />
          ))}
        </div>
      </div>

      {detailHero && (
        <HeroDetailPanel
          hero={detailHero}
          inDeck={deck.includes(detailHero.id)}
          deckFull={deck.length >= DECK_SIZE}
          onClose={() => setDetailHeroId(null)}
          onToggleDeck={() => {
            attemptToggle(detailHero.id);
            setDetailHeroId(null);
          }}
        />
      )}

      {replaceHero && (
        <div className="replace-picker-overlay">
          <div className="replace-picker-panel">
            <h3 className="font-display">Your deck is full</h3>
            <p>Choose a Demigod to replace with {replaceHero.name}.</p>
            <div className="replace-picker-list">
              {deck.map((id) => {
                const h = HERO_DEFINITIONS[id];
                const portrait = HERO_PORTRAIT[id];
                return (
                  <button
                    key={id}
                    className="replace-picker-row"
                    onClick={() => {
                      setDeck(deck.map((d) => (d === id ? replaceHero.id : d)));
                      setReplaceTarget(null);
                    }}
                  >
                    <img className="replace-picker-portrait" src={portrait ?? ROLE_ICON[h.role]} alt="" />
                    <span>{h.name}</span>
                  </button>
                );
              })}
            </div>
            <button className="secondary-button" onClick={() => setReplaceTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {infoOpen && (
        <div className="info-modal-overlay" onClick={() => setInfoOpen(false)}>
          <div className="info-modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display">Build Your Squad</h3>
            <p>
              Pick 5 Demigods to form your permanent deck. Before every battle, both players
              reveal their full 5 to each other — then each secretly chooses 3 of their own 5 to
              actually fight with, blind to the opponent's choice, before a short reveal and the
              battle begins.
            </p>
            <p>Long-press any card to see its full stats, lore, and abilities.</p>
            <button className="primary-button" onClick={() => setInfoOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
