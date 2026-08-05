import { getObjectives } from "../state/objectives";
import type { Objective } from "../state/objectives";

interface ObjectivesProps {
  onBack: () => void;
}

/** Its own screen as of §9.21 — previously an inline card on the main menu,
 * pulled out once the menu redesign gave Objectives a dedicated nav button
 * (matching the reference mockup's 5-button layout). */
export function Objectives({ onBack }: ObjectivesProps) {
  const { daily, weekly } = getObjectives();

  return (
    <div className="screen-with-header">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title">Objectives</span>
      </div>

      <div className="menu-screen">
        <div className="objectives-card">
          <ObjectiveGroup title="Daily" objectives={daily} />
          <ObjectiveGroup title="Weekly" objectives={weekly} />
        </div>
      </div>
    </div>
  );
}

function ObjectiveGroup({ title, objectives }: { title: string; objectives: Objective[] }) {
  return (
    <div className="objective-group">
      <div className="objective-group-title">{title}</div>
      {objectives.map((o) => (
        <div key={o.id} className={`objective-row${o.completed ? " done" : ""}`}>
          <span className="objective-label">
            {o.completed ? "✓" : "○"} {o.label}
          </span>
          <span className="objective-progress">
            {o.progress}/{o.target}
          </span>
        </div>
      ))}
    </div>
  );
}
