import { getObjectives } from "../state/objectives";

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
  onClan: () => void;
  onProfile: () => void;
}

/** §9.25: rebuilt from a much more detailed reference mockup — a full
 * mobile-game home-screen shell (side nav rail, top currency/profile
 * bar, a season banner, 3 mode buttons, a daily-reward bar, bottom
 * tabs) rather than the simpler single-column menu from §9.21-9.24.
 * Almost none of the systems this chrome implies exist yet (no
 * leveling, currency, seasons, clans, or a battle pass — see the
 * per-element notes below and DESIGN.md §9.25), so every number here
 * is a static, neutral placeholder and every nav target with no real
 * screen behind it goes to the shared ComingSoon component instead of
 * a silent dead click. */
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
  onClan,
  onProfile,
}: MainMenuProps) {
  const { daily, weekly } = getObjectives();
  const hasIncomplete = [...daily, ...weekly].some((o) => !o.completed);

  return (
    <div className="menu-root-v2">
      {/* Background: a castle-plaza scene built from CSS/SVG shapes
       * rather than a photo — no image-generation tool exists in this
       * project (see CHARACTER_CONCEPTS.md) and the one background
       * asset in the repo (arena-plaza.jpg) got explicit "looks
       * rubbish" feedback in §9.23 for its mismatched warm palette, so
       * this builds the mood (dark sky, glowing plaza floor, banner
       * pillars, a crystal-peak logo) directly instead of reaching for
       * another photo. */}
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

      {/* Sidebar + scrollable content share a flex row so the sidebar's
       * width is a real layout reservation, not a guessed absolute
       * offset — the min-height:0 flexbox gotcha from §9.22 taught that
       * lesson once already. */}
      <div className="menu-body-row">
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
            <div className="menu-logo-mountain" aria-hidden="true">
              <span className="peak peak-left" />
              <span className="peak peak-right" />
              <span className="peak peak-center" />
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
      </div>

      <nav className="menu-bottom-tabs">
        <TabButton icon="🧭" label="Home" active />
        <TabButton icon="🃏" label="Decks" onClick={onDeckBuilder} />
        <TabButton icon="🎫" label="Battle Pass" onClick={onBattlePass} />
        <TabButton icon="🛡" label="Clan" onClick={onClan} />
        <TabButton icon="👤" label="Profile" onClick={onProfile} />
      </nav>
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

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`menu-tab-button${active ? " active" : ""}`} onClick={onClick}>
      <span className="menu-tab-icon">{icon}</span>
      <span className="menu-tab-label">{label}</span>
    </button>
  );
}
