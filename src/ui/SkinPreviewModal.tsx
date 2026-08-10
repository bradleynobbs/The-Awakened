import type { StoreBundleItem } from "./storeData";

interface SkinPreviewModalProps {
  item: StoreBundleItem;
  onClose: () => void;
}

/** Full-screen art preview for a tapped bundle item (§9.51) — the same
 * overlay-panel pattern as HeroDetailPanel, scaled down since a Store
 * item has no stats/lore to show, just its name and full art. */
export function SkinPreviewModal({ item, onClose }: SkinPreviewModalProps) {
  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="skin-preview-panel" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button skin-preview-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <img className="skin-preview-art" src={item.image} alt={item.name} />
        <h3 className="font-display skin-preview-name">{item.name}</h3>
        <span className="skin-preview-kicker">{item.kicker}</span>
      </div>
    </div>
  );
}
