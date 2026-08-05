import { getObjectives } from "../state/objectives";
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
  onCustomMatch: () => void;
  onBattlePass: () => void;
}

/** §9.25 rebuilt this from a much more detailed reference mockup — a
 * full mobile-game home-screen shell. §9.26 then fixed three follow-up
 * complaints: the bottom tabs are now a persistent, app-wide sibling
 * (BottomTabs.tsx, rendered by App.tsx) instead of owned by this
 * screen alone; the sidebar floats over the content instead of
 * pushing it rightward off-center; and real hero art + the actual
 * emblem image are back (both were dropped in §9.25's rebuild, and
 * their absence is exactly why this stopped looking like this game's
 * own app). Almost none of the systems this chrome implies exist yet
 * (no leveling, currency, seasons, clans, or a battle pass — see the
 * per-element notes below and DESIGN.md §9.25/§9.26), so every number
 * here is a static, neutral placeholder and every nav target with no
 * real screen behind it goes to the shared ComingSoon component
 * instead of a silent dead click. */
export function MainMenu({
  online,
  onFindMatch,
  onPracticeMatch,
  onDeckBuilder,
  onStore,
  onObjectives,
  onEvents,
  onLeaderboard,
  onCustomMatch,
  onBattlePass,
}: MainMenuProps) {
  const { daily, weekly } = getObjectives();
  const hasIncomplete = [...daily, ...weekly].some((o) => !o.completed);

  return (
    <div className="menu-root-v2">
      {/* Real hero art, brought back from §9.21/9.24 (dropped in §9.25's
       * rebuild) — behind all the new chrome, showing through wherever
       * there's negative space, same as the reference mockups' own
       * layered composition. Picked for a wide (not narrow-crop)
       * silhouette at this size — see §9.21's note on Inferna/Kairo's
       * too-slender art. Right pair mirrored so both flanks face inward. */}
      <div className="menu-flank menu-flank-left" aria-hidden="true">
        <img src={zeraSprite} className="menu-flank-hero menu-flank-hero-spark" />
        <img src={mournSprite} className="menu-flank-hero menu-flank-hero-undead" />
      </div>
      <div className="menu-flank menu-flank-right" aria-hidden="true">
        <img src={orinSprite} className="menu-flank-hero menu-flank-hero-spirit" />
        <img src={tydraSprite} className="menu-flank-hero menu-flank-hero-water" />
      </div>

      {/* Castle-plaza dressing built from CSS/SVG shapes — no image-
       * generation tool exists in this project, and the one background
       * photo in the repo got "looks rubbish" feedback in §9.23. */}
      <div className="menu-plaza-floor" aria-hidden="true" />
      <div className="menu-banner-pole menu-banner-pole-left" aria-hidden="true">
        <span className="menu-banner-flag" />
      </div>
      <div className="menu-banner-pole menu-banner-pole-right" aria-hidden="true">
        <span className="menu-banner-flag" />
      </div>
      <div className="menu-backdrop" aria-hidden="true" />

      {/* Player card, currency stack, and utility icons below are all
       * cosmetic — this game has no leveling or currency system (Store
       * says so outright). Kept at neutral/zero starter values rather
       * than the mockup's specific large numbers, since copying those
       * would read as real earned progress instead of empty chrome. */}
      <div className="menu-topbar-v2">
        <div className="menu-player-card">
          <span className="menu-player-avatar-v2" aria-hidden="true">
            <span className="menu-logo-diamond menu-logo-diamond-outer avatar-diamond" />
          </span>
          <div className="menu-player-card-info">
            <span className="menu-player-name-v2">Player</span>
            <span className="menu-player-level-v2">Level 1</span>
          </div>
        </div>
        <div className="menu-currency-stack">
          <CurrencyRow icon="🪙" value="0" />
          <CurrencyRow icon="💠" value="0" />
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

      {/* Sidebar floats (position: absolute) over the content instead
       * of taking a flex-row share of its width — the earlier flex-row
       * split pushed the centered content rightward by roughly half the
       * sidebar's width, a real complaint after §9.25 shipped. This is
       * safe now (unlike an even earlier absolute-positioned attempt
       * that relied on guessed pixel offsets) because .menu-body-row is
       * itself properly height-bounded via flex:1 + min-height:0, so
       * the sidebar's top:0/bottom:0 anchors to a real box, not a guess. */}
      <div className="menu-body-row">
        <div className="menu-content-v2">
          {/* Season banner: purely decorative dressing, not a real season/
           * battle-pass system — its countdown says "Coming soon" rather
           * than a fabricated day count, since a fake countdown implies a
           * real deadline in a way a static 0 currency doesn't. */}
          <button className="menu-season-banner" onClick={onBattlePass}>
            <div className="menu-season-copy">
              <span className="menu-season-label">Season 1</span>
              <span className="menu-season-title">Dawnbreak</span>
              <span className="menu-season-timer">⏱ Coming soon</span>
            </div>
          </button>
          <div className="menu-carousel-dots" aria-hidden="true">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>

          <div className="menu-header-v2">
            {/* The actual game emblem (not a CSS approximation) — a
             * near-black background with no alpha channel, so
             * mix-blend-mode: screen (see App.css) makes the black
             * disappear against a matching glow instead of needing a
             * real alpha-keying pass for a flat-color background. */}
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

          <nav className="menu-mode-list">
            <ModeButton
              tone="teal"
              icon="⚔"
              title="Find Match"
              subtitle={online ? "Ranked 1v1" : "Not configured yet"}
              disabled={!online}
              onClick={onFindMatch}
            />
            <ModeButton tone="gold" icon="🧑‍🤝‍🧑" title="Practice" subtitle="Train & Improve" onClick={onPracticeMatch} />
            <ModeButton tone="purple" icon="🛡" title="Custom Match" subtitle="Play Your Way" onClick={onCustomMatch} />
          </nav>

          <div className="menu-daily-reward-bar">
            <span className="menu-daily-reward-bar-icon" aria-hidden="true">
              🎁
            </span>
            <div className="menu-daily-reward-bar-info">
              <span className="menu-daily-reward-bar-label">Daily Reward</span>
              <span className="menu-daily-reward-bar-count">0 / 5</span>
              <div className="menu-daily-reward-bar-track">
                <div className="menu-daily-reward-bar-fill" style={{ width: "0%" }} />
              </div>
            </div>
            <button className="menu-claim-button">Claim</button>
          </div>
        </div>

        {/* Store and Missions map onto real screens (Store, Objectives);
         * Collection reuses the Deck Builder (it's already "browse
         * every hero's full card text"); Events and Leaderboard have no
         * system behind them yet. */}
        <nav className="menu-sidebar">
          <SidebarItem icon="🛒" label="Store" onClick={onStore} />
          <SidebarItem icon="🃏" label="Collection" onClick={onDeckBuilder} />
          <SidebarItem icon="🎯" label="Missions" badge={hasIncomplete} onClick={onObjectives} />
          <SidebarItem icon="📅" label="Events" onClick={onEvents} />
          <SidebarItem icon="🏆" label="Leaderboard" onClick={onLeaderboard} />
        </nav>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  badge?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="menu-sidebar-item" onClick={onClick}>
      <span className="menu-sidebar-icon">
        {icon}
        {badge && <span className="menu-sidebar-badge" aria-hidden="true" />}
      </span>
      <span className="menu-sidebar-label">{label}</span>
    </button>
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

type ModeTone = "teal" | "gold" | "purple";

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
