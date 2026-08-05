import { useEffect, useState } from "react";
import { getObjectives } from "../state/objectives";
import zeraSprite from "../assets/heroes/zera-sprite.png";
import mournSprite from "../assets/heroes/mourn-sprite.png";
import orinSprite from "../assets/heroes/orin-sprite.png";
import tydraSprite from "../assets/heroes/tydra-sprite.png";
import arenaBackground from "../assets/backgrounds/arena-plaza.jpg";

interface MainMenuProps {
  online: boolean;
  onFindMatch: () => void;
  onPracticeMatch: () => void;
  onDeckBuilder: () => void;
  onStore: () => void;
  onObjectives: () => void;
}

export function MainMenu({
  online,
  onFindMatch,
  onPracticeMatch,
  onDeckBuilder,
  onStore,
  onObjectives,
}: MainMenuProps) {
  const { daily, weekly } = getObjectives();
  const hasIncomplete = [...daily, ...weekly].some((o) => !o.completed);
  const resetTimer = useCountdownToNextReset();

  return (
    <div className="menu-root" style={{ backgroundImage: `url(${arenaBackground})` }}>
      {/* Decorative only — real hero art framing the menu, mirroring §9.21's
       * reference mockup. Left pair faces right (their default orientation,
       * see HeroSprite.tsx), right pair is mirrored via CSS so both sides
       * face inward toward the logo, like a hero-select cover illustration.
       * Picked for a wide (not narrow-crop) silhouette at this large a
       * size — Inferna and Kairo's trimmed art is too slender a sliver to
       * read well here, see §9.21's note on this in DESIGN.md. */}
      <div className="menu-flank menu-flank-left" aria-hidden="true">
        <img src={zeraSprite} className="menu-flank-hero menu-flank-hero-spark" />
        <img src={mournSprite} className="menu-flank-hero menu-flank-hero-undead" />
      </div>
      <div className="menu-flank menu-flank-right" aria-hidden="true">
        <img src={orinSprite} className="menu-flank-hero menu-flank-hero-spirit" />
        <img src={tydraSprite} className="menu-flank-hero menu-flank-hero-water" />
      </div>
      <div className="menu-backdrop" aria-hidden="true" />

      {/* Player badge, currency, and the daily-reward timer below are
       * cosmetic — this game has no leveling or currency system (see
       * Store.tsx's own copy), so there's nothing real backing these
       * numbers. Included anyway per direct request to match the
       * reference mockup as closely as possible (§9.21) rather than
       * only its layout/style. The one genuinely real piece is the
       * countdown itself: it ticks down to the actual UTC-midnight
       * boundary objectives.ts already resets daily progress at. */}
      <div className="menu-topbar">
        <div className="menu-player-badge">
          <span className="menu-player-avatar" aria-hidden="true">
            <span className="menu-logo-diamond menu-logo-diamond-outer avatar-diamond" />
          </span>
          <div className="menu-player-info">
            <span className="menu-player-name">Awakened · Level 1</span>
            <div className="menu-player-xp-track">
              <div className="menu-player-xp-fill" style={{ width: "4%" }} />
            </div>
          </div>
        </div>
        <div className="menu-topbar-right">
          <span className="menu-currency-pill">
            <span className="menu-currency-icon">🪙</span>0
          </span>
          <span className="menu-currency-pill">
            <span className="menu-currency-icon">💎</span>0
          </span>
          <button className="icon-button menu-settings-button" aria-label="Settings">
            ⚙
          </button>
        </div>
      </div>

      <div className="menu-header">
        <div className="menu-logo-emblem" aria-hidden="true">
          <span className="menu-logo-diamond menu-logo-diamond-outer" />
          <span className="menu-logo-diamond menu-logo-diamond-inner" />
        </div>
        <h1 className="menu-title">The Awakened</h1>
        <p className="menu-tagline">Rise. Awaken. Conquer.</p>
      </div>

      <div className="menu-content">
        <nav className="menu-action-list">
          <MenuAction
            tone="violet"
            icon="⚔"
            title="Find Match"
            subtitle={
              online
                ? "Jump into matches against real players."
                : "Not configured yet — try Practice instead."
            }
            disabled={!online}
            onClick={onFindMatch}
          />
          <MenuAction
            tone="blue"
            icon="🎯"
            title="Practice"
            subtitle="Hone your skills vs AI opponents."
            onClick={onPracticeMatch}
          />
          <MenuAction
            tone="gold"
            icon="🛒"
            title="Store"
            subtitle="Nothing to buy yet — skill decides matches."
            onClick={onStore}
          />
          <MenuAction
            tone="green"
            icon="🃏"
            title="Team Building"
            subtitle="Build your perfect team of Awakened."
            onClick={onDeckBuilder}
          />
          <MenuAction
            tone="slate"
            icon="📋"
            title="Objectives"
            subtitle="Complete objectives and track progress."
            badge={hasIncomplete}
            onClick={onObjectives}
          />
        </nav>
      </div>

      <div className="menu-footer">
        <div className="menu-daily-reward">
          <span className="menu-daily-reward-icon" aria-hidden="true">
            🎁
          </span>
          <div className="menu-daily-reward-info">
            <span className="menu-daily-reward-label">Daily Reset</span>
            <span className="menu-daily-reward-timer">{resetTimer}</span>
          </div>
        </div>
        <div className="menu-social-links">
          <button className="menu-social-icon" aria-label="Discord">
            💬
          </button>
          <button className="menu-social-icon" aria-label="Instagram">
            📷
          </button>
          <button className="menu-social-icon" aria-label="Twitter">
            🐦
          </button>
        </div>
      </div>
    </div>
  );
}

type MenuActionTone = "violet" | "blue" | "gold" | "green" | "slate";

interface MenuActionProps {
  tone: MenuActionTone;
  icon: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  badge?: boolean;
  onClick: () => void;
}

function MenuAction({ tone, icon, title, subtitle, disabled, badge, onClick }: MenuActionProps) {
  return (
    <button className={`menu-action menu-action-${tone}`} disabled={disabled} onClick={onClick}>
      <span className="menu-action-icon">{icon}</span>
      <span className="menu-action-copy">
        <span className="menu-action-title">{title}</span>
        <span className="menu-action-subtitle">{subtitle}</span>
      </span>
      {badge && <span className="menu-action-badge" aria-hidden="true" />}
    </button>
  );
}

/** Ticks down to the next UTC-midnight boundary — the exact instant
 * objectives.ts's dayKey() rolls over daily progress (it keys off
 * `toISOString()`, which is UTC). Reusing that real boundary instead of
 * a made-up one, since this timer otherwise has nothing real to count
 * down to (see the no-currency/no-leveling note above). */
function useCountdownToNextReset(): string {
  const [remainingMs, setRemainingMs] = useState(msUntilNextUtcMidnight);

  useEffect(() => {
    const id = setInterval(() => setRemainingMs(msUntilNextUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return next - now.getTime();
}
