import { useState } from "react";
import { MOCK_SPARK_BALANCE, STORE_TABS, SUMMER_SURGE_BUNDLE, type StoreBundleItem, type StoreTab } from "./storeData";
import { StoreBanner } from "./StoreBanner";
import { StoreSkinCard } from "./StoreSkinCard";
import { SkinPreviewModal } from "./SkinPreviewModal";
import { SectionDivider } from "./SectionDivider";

interface StoreProps {
  onBack: () => void;
}

const TOAST_MS = 2200;

/**
 * The Item Shop (§9.51 — see DESIGN.md). Built from a supplied "Summer
 * Surge Bundle" mockup and the real Spark/Luxe/Ember/Cloudy art the
 * user provided for it — an explicit later instruction ("don't add
 * anything apart from things in the screenshot or the images")
 * narrowed this down from a much larger original brief, so the
 * Featured tab below is the *only* thing here with real content; the
 * other tabs are left as an honest "coming soon" rather than
 * inventing skins, offers, or prices that were never shown to us.
 * Same "no purchases are real" convention as the rest of the app
 * (see README) — the CTA buttons show a toast instead of charging
 * anything.
 */
export function Store({ onBack }: StoreProps) {
  const [tab, setTab] = useState<StoreTab>("Featured");
  const [previewItem, setPreviewItem] = useState<StoreBundleItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), TOAST_MS);
  };

  const bundle = SUMMER_SURGE_BUNDLE;

  return (
    <div className="screen-with-header store-screen">
      <div className="screen-header store-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title font-display store-header-title">Item Shop</span>
        <div className="store-balance-pill">
          <span className="store-currency-icon" aria-hidden="true">
            ⚡
          </span>
          {MOCK_SPARK_BALANCE.toLocaleString()}
          <span className="store-balance-add" aria-hidden="true">
            +
          </span>
        </div>
      </div>

      <div className="store-tab-row">
        {STORE_TABS.map((t) => (
          <button key={t} className={`store-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="store-body">
        {tab === "Featured" ? (
          <>
            <StoreBanner bundle={bundle} onGetBundle={() => showToast("Store preview — purchases aren't wired up yet.")} />

            <SectionDivider>Bundle Includes</SectionDivider>
            <div className="store-skin-grid">
              {bundle.items.map((item) => (
                <StoreSkinCard key={item.id} item={item} onTap={() => setPreviewItem(item)} />
              ))}
            </div>

            <SectionDivider>Featured</SectionDivider>
            <div className="store-featured-card">
              <img className="store-featured-art" src={bundle.featured.image} alt={bundle.featured.name} />
              <div className="store-featured-copy">
                <h2 className="font-display store-featured-name">{bundle.featured.name}</h2>
                <span className="store-featured-kicker">{bundle.featured.kicker}</span>
                <button
                  className="store-featured-buy"
                  onClick={() => showToast("Store preview — purchases aren't wired up yet.")}
                >
                  <span className="store-currency-icon" aria-hidden="true">
                    ⚡
                  </span>
                  {bundle.featured.price.toLocaleString()}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="store-coming-soon">
            <span className="store-icon">🛒</span>
            <h2 className="font-display">Coming Soon</h2>
            <p className="menu-warning" style={{ color: "#9aa2c0" }}>
              The {tab} tab isn't stocked yet — check back later.
            </p>
          </div>
        )}
      </div>

      {previewItem && <SkinPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      {toast && (
        <div className="store-toast" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
