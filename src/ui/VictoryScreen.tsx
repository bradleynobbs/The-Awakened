import type { PlayerId } from "../engine/types";

interface VictoryScreenProps {
  winnerId: PlayerId;
  myRole: PlayerId;
  onLeave: () => void;
}

export function VictoryScreen({ winnerId, myRole, onLeave }: VictoryScreenProps) {
  const won = winnerId === myRole;
  return (
    <div className="victory-screen">
      <h1>{won ? "Victory!" : "Defeat"}</h1>
      <p>{won ? "You defeated all 3 enemy heroes." : "All 3 of your heroes were defeated."}</p>
      <button className="primary-button" onClick={onLeave}>
        Back to Menu
      </button>
    </div>
  );
}
