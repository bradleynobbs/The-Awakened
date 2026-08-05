export type BottomTab = "home" | "decks" | "battlepass" | "clan" | "profile";

interface BottomTabsProps {
  /** null when the current screen doesn't correspond to any tab
   * (Store, Objectives, Events, Leaderboard, Custom Match) — none of
   * them highlight as active, rather than falsely claiming one does. */
  active: BottomTab | null;
  onHome: () => void;
  onDecks: () => void;
  onBattlePass: () => void;
  onClan: () => void;
  onProfile: () => void;
}

/** §9.26: pulled out of MainMenu.tsx into its own persistent, app-wide
 * component — rendered by App.tsx as a sibling alongside whichever
 * screen is showing, not owned by any one screen, so it's clickable
 * from every meta/menu screen instead of just the main menu itself. */
export function BottomTabs({ active, onHome, onDecks, onBattlePass, onClan, onProfile }: BottomTabsProps) {
  return (
    <nav className="menu-bottom-tabs">
      <TabButton icon="🧭" label="Home" active={active === "home"} onClick={onHome} />
      <TabButton icon="🃏" label="Decks" active={active === "decks"} onClick={onDecks} />
      <TabButton icon="🎫" label="Battle Pass" active={active === "battlepass"} onClick={onBattlePass} />
      <TabButton icon="🛡" label="Clan" active={active === "clan"} onClick={onClan} />
      <TabButton icon="👤" label="Profile" active={active === "profile"} onClick={onProfile} />
    </nav>
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
