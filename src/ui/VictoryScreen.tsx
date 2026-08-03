import type { PlayerId } from "../engine/types";

interface VictoryScreenProps {
  winnerId: PlayerId;
  onRestart: () => void;
}

export function VictoryScreen({ winnerId, onRestart }: VictoryScreenProps) {
  return (
    <div className="victory-screen">
      <h1>{winnerId === "player1" ? "Player 1" : "Player 2"} Wins!</h1>
      <p>All 3 enemy heroes have been defeated.</p>
      <button className="primary-button" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}
