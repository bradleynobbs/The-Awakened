import { useEffect, useState } from "react";
import { getObjectives } from "../state/objectives";
import { MenuSheet } from "./MenuSheet";
import zeraSprite from "../assets/heroes/zera-sprite.png";
import mournSprite from "../assets/heroes/mourn-sprite.png";
import orinSprite from "../assets/heroes/orin-sprite.png";
import tydraSprite from "../assets/heroes/tydra-sprite.png";
import awakenedEmblem from "../assets/branding/awakened-emblem.png";

interface MainMenuProps {
  online: boolean;
  onFindMatch: () => void;
  onPracticeMatch: () => void;
  onDeckBuilder: () => void;
  onStore: () => void;
  onObjectives: () => void;
  onEvents: () => void;
  onLeaderboard: () => void;
  onBattlePass: () => void;
}

/** Purely decorative promo slides (§9.27) — this game has no season
 * pass or news system, so these are flavor text, not real content.
 * All route to the same ComingSoon screen on click regardless of which
 * slide is showing, same as a single static banner would have. */
const BANNER_SLIDES = [
  { label: "Season 1", title: "Dawnbreak", note: "Coming soon" },
  { label: "Roster", title: "17 Demigods", note: "Every element, doubled" },
  { label: "Tip", title: "Match your elements", note: "Water beats Spark, Spark beats Earth…" },
] as const;

const BANNER_ROTATE_MS = 5000;

/** §9.25 rebuilt this from a much more detailed reference mockup — a
 * full mobile-game home-screen shell. §9.26 fixed off-center content,
 * made the bottom tabs a persistent app-wide sibling, and restored
 * real hero art + the actual emblem image. §9.27 is a full premium-
 * polish pass: the left sidebar is gone (see MenuSheet.tsx — its 5
 * items now live in a bottom sheet instead of a permanent 56px column
 * eating into every screen), hero art fades to ~25% opacity as ambient
 * dressing rather than competing for attention, glassmorphism panels,
 * a blue-for-ranked/purple+gold-for-everything-else palette, a
 * rotating promo banner, and CSS-only ambient particles/floating
 * crystals. Almost none of the systems this chrome implies exist yet
 * (no leveling, currency, seasons, clans, or a battle pass), so every
 * number here is a static, neutral placeholder and every nav target
 * with no real screen behind it goes to the shared ComingSoon
 * component instead of a silent dead click. */
export function MainMenu({
  online,
  onFindMatch,
  onPracticeMatch,
  onDeckBuilder,
  onStore,
  onObjectives,
  onEvents,
  onLeaderboard,
  onBattlePass,
}: MainMenuProps) {
  const { daily, weekly } = getObjectives();
  const hasIncomplete = [...daily, ...weekly].some((o) => !o.completed);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BANNER_SLIDES.length), BANNER_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const activeSlide = BANNER_SLIDES[slide];

  return (
    <div className="menu-root-v2">
      {/* Real hero art — faded to ~25% opacity (§9.27) so it reads as
       * ambient dressing behind the UI rather than competing with it
       * for attention (a direct reversal of §9.24's "brighter" fix,
       * now that the surrounding chrome is busier and needs the
       * contrast more than the art does). */}
      <div className="menu-flank menu-flank-left" aria-hidden="true">
        <img src={zeraSprite} className="menu-flank-hero menu-flank-hero-spark" />
        <img src={mournSprite} className="menu-flank-hero menu-flank-hero-undead" />
      </div>
      <div className="menu-flank menu-flank-right" aria-hidden="true">
        <img src={orinSprite} className="menu-flank-hero menu-flank-hero-spirit" />
        <img src={tydraSprite} className="menu-flank-hero menu-flank-hero-water" />
      </div>

      <div className="menu-plaza-floor" aria-hidden="true" />
      <div className="menu-banner-pole menu-banner-pole-left" aria-hidden="true">
        <span className="menu-banner-flag" />
      </div>
      <div className="menu-banner-pole menu-banner-pole-right" aria-hidden="true">
        <span className="menu-banner-flag" />
      </div>

      {/* Ambient particles + floating crystals (§9.27) — fixed,
       * lightweight CSS-only decoration (no animation library), a
       * handful of absolutely-positioned elements styled per
       * nth-child in App.css for varied position/size/delay. */}
      <div className="menu-particles" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="menu-particle" />
        ))}
      </div>
      <div className="menu-crystals" aria-hidden="true">
        <span className="menu-crystal" />
        <span className="menu-crystal" />
        <span className="menu-crystal" />
      </div>

      <div className="menu-backdrop" aria-hidden="true" />

      {/* Player card, currencies, and utility icons are all cosmetic —
       * this game has no leveling or currency system (Store says so
       * outright). Kept at neutral/zero starter values rather than
       * the mockup's specific large numbers, since copying those
       * would read as real earned progress instead of empty chrome.
       * Glassmorphism (semi-transparent + backdrop-blur) per §9.27. */}
      <div className="menu-topbar-v2">
        <div className="menu-topbar-left">
          {/* Replaces the old persistent left sidebar (§9.25/9.26) —
           * opens MenuSheet, a bottom sheet holding the same 5 items.
           * Lives in the top bar rather than floating over the
           * scrollable button list below: an earlier attempt at the
           * latter put it at a fixed screen position that, on short
           * viewports, ended up sitting on top of whichever mode
           * button happened to land there — a real, unavoidable
           * conflict once full-width buttons and a floating corner
           * button compete for the same few pixels. */}
          <button className="menu-sheet-trigger" onClick={() => setSheetOpen(true)} aria-label="Menu">
            <span className="menu-sheet-trigger-bar" />
            <span className="menu-sheet-trigger-bar" />
            <span className="menu-sheet-trigger-bar" />
          </button>
          <div className="menu-player-card">
            <span className="menu-player-avatar-v2" aria-hidden="true">
              <span className="menu-logo-diamond menu-logo-diamond-outer avatar-diamond" />
            </span>
            <div className="menu-player-card-info">
              <span className="menu-player-name-v2">Player</span>
              <span className="menu-player-level-v2">Level 1</span>
            </div>
          </div>
        </div>
        <div className="menu-currency-stack">
          <CurrencyRow icon="🪙" value="0" />
          <CurrencyRow icon="💎" value="0" />
          <CurrencyRow icon="🔮" value="0" />
        </div>
        <div className="menu-topbar-icons">
          <button className="icon-button menu-topbar-icon" aria-label="Friends">
            👥
          </button>
          <button className="icon-button menu-topbar-icon" aria-label="Mail">
            ✉️
          </button>
          <button className="icon-button menu-topbar-icon" aria-label="Settings">
            ⚙
          </button>
        </div>
      </div>

      <div className="menu-body-row">
        <div className="menu-content-v2">
          {/* Rotating promo banner (§9.27) — purely decorative, cycles
           * every 5s through flavor slides; whichever is showing still
           * opens the same ComingSoon screen on click. */}
          <button className="menu-season-banner" onClick={onBattlePass}>
            <div className="menu-season-copy">
              <span className="menu-season-label">{activeSlide.label}</span>
              <span className="menu-season-title">{activeSlide.title}</span>
              <span className="menu-season-timer">{activeSlide.note}</span>
            </div>
          </button>
          <div className="menu-carousel-dots" aria-hidden="true">
            {BANNER_SLIDES.map((s, i) => (
              <span key={s.title} className={`dot${i === slide ? " active" : ""}`} />
            ))}
          </div>

          <div className="menu-header-v2">
            <div className="menu-emblem-wrap" aria-hidden="true">
              <img src={awakenedEmblem} className="menu-emblem-image" alt="" />
            </div>
            <h1 className="menu-title-v2">
              The
              <br />
              Awakened
            </h1>
            <p className="menu-tagline-v2">Demi Gods. Limitless Power.</p>
          </div>

          {/* Blue is reserved for ranked (Find Match) per the palette
           * spec — Practice stays in the purple/gold family used
           * everywhere else. Custom Match was dropped in §9.28 — with
           * it gone, the menu fits a real phone viewport without
           * scrolling. */}
          <nav className="menu-mode-list">
            <ModeButton
              tone="blue"
              icon="⚔"
              title="Find Match"
              subtitle={online ? "Ranked 1v1" : "Not configured yet"}
              disabled={!online}
              onClick={onFindMatch}
            />
            <ModeButton tone="gold" icon="🧑‍🤝‍🧑" title="Practice" subtitle="Train & Improve" onClick={onPracticeMatch} />
          </nav>
        </div>
      </div>

      <MenuSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        hasIncompleteMissions={hasIncomplete}
        onStore={onStore}
        onCollection={onDeckBuilder}
        onMissions={onObjectives}
        onEvents={onEvents}
        onLeaderboard={onLeaderboard}
      />
    </div>
  );
}

function CurrencyRow({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="menu-currency-row">
      <span className="menu-currency-row-icon">{icon}</span>
      {value}
      <span className="menu-currency-row-plus" aria-hidden="true">
        +
      </span>
    </span>
  );
}

type ModeTone = "blue" | "gold";

function ModeButton({
  tone,
  icon,
  title,
  subtitle,
  disabled,
  onClick,
}: {
  tone: ModeTone;
  icon: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`menu-mode-button menu-mode-${tone}`} disabled={disabled} onClick={onClick}>
      <span className="menu-mode-icon">{icon}</span>
      <span className="menu-mode-copy">
        <span className="menu-mode-title">{title}</span>
        <span className="menu-mode-subtitle">{subtitle}</span>
      </span>
      <span className="menu-mode-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
