interface ComingSoonProps {
  title: string;
  icon: string;
  message: string;
  onBack: () => void;
}

/** Shared placeholder for every nav destination added in §9.25 that has
 * no real system behind it yet (Events, Leaderboard, Battle Pass,
 * Clan, Profile) — one component instead of five near-identical
 * screens, following Store.tsx's existing "honest coming soon"
 * precedent rather than a silent dead click. */
export function ComingSoon({ title, icon, message, onBack }: ComingSoonProps) {
  return (
    <div className="screen-with-header">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title">{title}</span>
      </div>

      <div className="menu-screen">
        <span className="store-icon">{icon}</span>
        <h1>Coming Soon</h1>
        <p className="menu-warning" style={{ color: "#9aa2c0" }}>
          {message}
        </p>
        <button className="secondary-button" onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
