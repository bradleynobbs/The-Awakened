import { useEffect, useState } from "react";
import { HERO_DEFINITIONS, HERO_LIST } from "../engine/heroes";
import type { Element, HeroDefinition, HeroId, Role } from "../engine/types";
import { DECK_SIZE, getDeck, saveDeck } from "../state/loadout";
import { HERO_PORTRAIT, ROLE_ICON } from "./heroVisuals";
import { DeckSlotCard } from "./DeckSlotCard";
import { HeroCollectionCard } from "./HeroCollectionCard";
import { HeroDetailPanel } from "./HeroDetailPanel";

interface DeckBuilderProps {
  onBack: () => void;
}

const ELEMENT_FILTERS: Element[] = ["fire", "water", "spark", "earth", "spirit", "undead", "charm"];
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

/** Redesigned per a detailed brief (§9.46, see DESIGN.md): a persistent
 * 5-hero deck (not the old 3-hero "preferred loadout" — that concept is
 * gone, since which 3 of the 5 actually fight is now decided fresh
 * every match by Battle Preparation's draft, see BattlePrep.tsx) built
 * from a filterable/sortable collection of compact cards, with a
 * full-screen detail panel for anything beyond the collection card's
 * headline stats. The deck auto-saves on every change — there's no
 * separate "Save" step, matching how the brief's mock has no save
 * button either, just a live "MY DECK (n/5)" counter. */
export function DeckBuilder({ onBack }: DeckBuilderProps) {
  const [deck, setDeck] = useState<HeroId[]>(() => getDeck());
  const [elementFilter, setElementFilter] = useState<Element | "all">("all");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      <div className="menu-particles" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="menu-particle" />
        ))}
      </div>
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title">Deck Builder</span>
        <div className="screen-header-actions">
          <button
            className={`deck-builder-tool-btn${filtersOpen ? " active" : ""}`}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters
          </button>
          <button className="deck-builder-tool-btn" onClick={cycleSort}>
            Sort: {SORT_LABELS[sortMode]}
          </button>
        </div>
      </div>

      <div className="deck-builder-body">
        <section className="deck-builder-my-deck">
          <h2 className="deck-builder-section-title">
            MY DECK ({deck.length}/{DECK_SIZE})
          </h2>
          <div className="deck-slot-row">
            {Array.from({ length: DECK_SIZE }, (_, i) => deck[i] ?? null).map((heroId, i) => (
              <DeckSlotCard
                key={heroId ?? `empty-${i}`}
                hero={heroId ? HERO_DEFINITIONS[heroId] : null}
                onClick={heroId ? () => setDetailHeroId(heroId) : undefined}
              />
            ))}
          </div>
        </section>

        {filtersOpen && (
          <section className="deck-builder-filters">
            <div className="filter-chip-row">
              <button
                className={`filter-chip${elementFilter === "all" ? " active" : ""}`}
                onClick={() => setElementFilter("all")}
              >
                All
              </button>
              {ELEMENT_FILTERS.map((el) => (
                <button
                  key={el}
                  className={`filter-chip${elementFilter === el ? " active" : ""}`}
                  onClick={() => setElementFilter(el)}
                >
                  {el[0].toUpperCase() + el.slice(1)}
                </button>
              ))}
            </div>
            <div className="filter-chip-row">
              <button
                className={`filter-chip${roleFilter === "all" ? " active" : ""}`}
                onClick={() => setRoleFilter("all")}
              >
                All Roles
              </button>
              {ROLE_FILTERS.map((role) => (
                <button
                  key={role}
                  className={`filter-chip${roleFilter === role ? " active" : ""}`}
                  onClick={() => setRoleFilter(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="deck-builder-section-title">Choose Your Demigods</h2>
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
        </section>
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
            <h3>Your deck is full</h3>
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
    </div>
  );
}
