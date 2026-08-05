interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  hasIncompleteMissions: boolean;
  onStore: () => void;
  onCollection: () => void;
  onMissions: () => void;
  onEvents: () => void;
  onLeaderboard: () => void;
}

/** §9.27: replaces the persistent left sidebar (§9.25/9.26) — on a
 * real phone it ate a full 56px-wide column down the entire screen
 * for icons that are used far less often than the main mode buttons.
 * A bottom sheet, opened from a single compact trigger, keeps that
 * screen real estate for artwork and the 3 main buttons the rest of
 * the time, matching how Clash Royale/Brawl Stars-tier menus handle
 * secondary navigation. */
export function MenuSheet({
  open,
  onClose,
  hasIncompleteMissions,
  onStore,
  onCollection,
  onMissions,
  onEvents,
  onLeaderboard,
}: MenuSheetProps) {
  if (!open) return null;

  const go = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="menu-sheet-backdrop" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-sheet-handle" aria-hidden="true" />
        <span className="menu-sheet-title">Menu</span>
        <div className="menu-sheet-list">
          <SheetItem icon="🛒" label="Store" onClick={go(onStore)} />
          <SheetItem icon="🃏" label="Collection" onClick={go(onCollection)} />
          <SheetItem icon="🎯" label="Missions" badge={hasIncompleteMissions} onClick={go(onMissions)} />
          <SheetItem icon="📅" label="Events" onClick={go(onEvents)} />
          <SheetItem icon="🏆" label="Leaderboard" onClick={go(onLeaderboard)} />
        </div>
      </div>
    </div>
  );
}

function SheetItem({
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
    <button className="menu-sheet-item" onClick={onClick}>
      <span className="menu-sheet-item-icon">{icon}</span>
      <span className="menu-sheet-item-label">{label}</span>
      {badge && <span className="menu-sheet-item-badge" aria-hidden="true" />}
      <span className="menu-sheet-item-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
