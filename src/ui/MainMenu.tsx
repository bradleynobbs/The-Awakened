interface MainMenuProps {
  online: boolean;
  onFindMatch: () => void;
}

export function MainMenu({ online, onFindMatch }: MainMenuProps) {
  return (
    <div className="menu-screen">
      <h1 className="menu-title">The Awakened</h1>
      <p className="menu-tagline">1v1 tactical card battler</p>
      <button className="primary-button" disabled={!online} onClick={onFindMatch}>
        Find Match
      </button>
      {!online && (
        <p className="menu-warning">
          Online multiplayer isn't configured yet — the app is missing its Supabase connection.
        </p>
      )}
    </div>
  );
}
