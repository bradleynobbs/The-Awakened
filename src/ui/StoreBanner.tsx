import type { StoreBundle } from "./storeData";
import summerSurgeBanner from "../assets/store/summer-surge-banner.png";

interface StoreBannerProps {
  bundle: StoreBundle;
  onGetBundle: () => void;
}

/** The Item Shop's hero banner (§9.51) — matches the supplied "Summer
 * Surge Bundle" mockup's layout: a "NEW!" corner ribbon, the bundle's
 * own art (Spark, Luxe and Cloudy together, already composed that way
 * in the source image), a two-line display title, tagline, and a
 * price row with the struck-through original price and discount tag. */
export function StoreBanner({ bundle, onGetBundle }: StoreBannerProps) {
  return (
    <div className="store-banner">
      <span className="store-banner-badge">{bundle.badge}</span>
      <img className="store-banner-art" src={summerSurgeBanner} alt="" aria-hidden="true" />
      <div className="store-banner-copy">
        <h1 className="store-banner-title font-display">
          {bundle.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="store-banner-tagline">
          {bundle.tagline.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <button className="store-banner-cta" onClick={onGetBundle}>
          <span className="store-banner-price-row">
            <span className="store-currency-icon" aria-hidden="true">
              ⚡
            </span>
            <span className="store-banner-price">{bundle.price.toLocaleString()}</span>
            <span className="store-banner-price-original">{bundle.originalPrice.toLocaleString()}</span>
            <span className="store-banner-discount">{bundle.discountPercent}% OFF</span>
          </span>
        </button>
      </div>
    </div>
  );
}
