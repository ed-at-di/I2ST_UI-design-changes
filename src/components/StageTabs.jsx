import { Plus } from "lucide-react";
import { stagePersonaComplete } from "../lib/stageHelpers.js";

export function StageTabs({
  stages,
  activeStageIndex,
  onSelectStage,
  label,
  idPrefix,
  panelIdPrefix,
  onAddStage,
  maxStages = 3,
  variant = "main",
}) {
  return (
    <div className={`stageTabs stageTabs-${variant}`} role="tablist" aria-label={label}>
      {stages.map((stage, index) => {
        const complete = stagePersonaComplete(stage);
        const stateClass = complete ? "complete" : "unfinished";
        const tabId = idPrefix ? `${idPrefix}-${index + 1}` : undefined;
        const panelId = panelIdPrefix ? `${panelIdPrefix}-${index + 1}` : undefined;

        return (
          <button
            className={`${stateClass} ${index === activeStageIndex ? "active" : ""}`.trim()}
            type="button"
            role="tab"
            aria-selected={index === activeStageIndex}
            aria-controls={panelId}
            id={tabId}
            onClick={() => onSelectStage(index)}
            key={stage.id}
          >
            <span>Character {index + 1}</span>
            <small>{complete ? "Persona complete" : "Needs persona"}</small>
          </button>
        );
      })}

      {onAddStage && stages.length < maxStages && (
        <button className="stageTabsAdd" type="button" onClick={onAddStage} aria-label={`Add character ${stages.length + 1}`}>
          <span><Plus size={15} /> Add character</span>
          <small>Optional next call</small>
        </button>
      )}
    </div>
  );
}
