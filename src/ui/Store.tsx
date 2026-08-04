interface StoreProps {
  onBack: () => void;
}

export function Store({ onBack }: StoreProps) {
  return (
    <div className="screen-with-header">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title">Store</span>
      </div>

      <div className="menu-screen">
        <span className="store-icon">🛒</span>
        <h1>Coming Soon</h1>
        <p className="menu-warning" style={{ color: "#9aa2c0" }}>
          There's nothing to buy yet — this game has no currency or purchases. Team composition
          and skill decide matches, not what you own.
        </p>
        <button className="secondary-button" onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
