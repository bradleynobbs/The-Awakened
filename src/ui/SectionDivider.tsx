import type { ReactNode } from "react";

/** A gold diamond-and-line ornament flanking a section heading — the
 * mockup's own "MY DECK ◈──" styling (§9.47 — see DESIGN.md), used for
 * both "Pick 5 Demigods" and "Choose Your Demigods". */
export function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <div className="section-divider">
      <span className="section-divider-line" />
      <span className="section-divider-diamond">◆</span>
      <h2 className="section-divider-title">{children}</h2>
      <span className="section-divider-diamond">◆</span>
      <span className="section-divider-line" />
    </div>
  );
}
