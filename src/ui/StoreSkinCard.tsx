import type { StoreBundleItem } from "./storeData";

interface StoreSkinCardProps {
  item: StoreBundleItem;
  onTap: () => void;
}

/** One tile in the "Bundle Includes" row (§9.51) — tap opens the full
 * SkinPreviewModal, matching the Deck Builder's own tap-for-detail
 * convention elsewhere in the app. */
export function StoreSkinCard({ item, onTap }: StoreSkinCardProps) {
  return (
    <button className="store-skin-card" onClick={onTap}>
      <div className="store-skin-card-art-frame">
        <img className="store-skin-card-art" src={item.image} alt={item.name} />
      </div>
      <span className="store-skin-card-name">{item.name}</span>
      <span className="store-skin-card-kicker">{item.kicker}</span>
    </button>
  );
}
