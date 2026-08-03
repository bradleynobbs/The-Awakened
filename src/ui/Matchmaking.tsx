interface MatchmakingProps {
  onCancel: () => void;
}

export function Matchmaking({ onCancel }: MatchmakingProps) {
  return (
    <div className="menu-screen">
      <div className="spinner" />
      <h1>Finding an opponent…</h1>
      <button className="secondary-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
