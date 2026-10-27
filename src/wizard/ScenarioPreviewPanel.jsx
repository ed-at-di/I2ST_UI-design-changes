import { useLayoutEffect, useRef } from "react";
import { Check, Copy, Layers3 } from "lucide-react";
import { StageTabs } from "../components/StageTabs.jsx";
import { formValue, selectedList, sourceLabel } from "../lib/scenarioHelpers.js";
import { activeScenarioStages, personaValuesForStage, stagePersonaComplete } from "../lib/stageHelpers.js";

function PreviewBlock({ label, complete, children, sectionRef, active = false, onNavigate }) {
  return (
    <section
      ref={sectionRef}
      className={`livePreviewBlock ${complete ? "complete" : ""} ${active ? "active" : ""} ${onNavigate ? "navigable" : ""}`}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (onNavigate && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onNavigate();
        }
      }}
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
    >
      <div className="livePreviewBlockHeader">
        <span>{label}</span>
        <span className="livePreviewBlockStatus" aria-label={complete ? "Selection added" : "Not yet completed"}>
          {complete ? <Check size={12} /> : "—"}
        </span>
      </div>
      {children}
    </section>
  );
}

function TagList({ values, emptyText }) {
  if (!values.length) return <p className="livePreviewEmpty">{emptyText}</p>;
  return (
    <div className="livePreviewTags">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

export function ScenarioPreviewPanel({
  form,
  catalog,
  source,
  isManualSource,
  competencies,
  scenario,
  preview,
  scenarioName,
  isExistingCopy,
  copySaved,
  originalName,
  wizardStep,
  activeStageIndex,
  setActiveStageIndex,
  onNavigate,
  visibleSteps = new Set(),
}) {
  const factors = selectedList(form.scenarioFactors || [], form.otherFactor);
  const complexities = selectedList(form.scenarioComplexities || [], form.otherComplexity);
  const stages = activeScenarioStages(form);
  const previewBodyRef = useRef(null);
  const sourceSectionRef = useRef(null);
  const kpaSectionRef = useRef(null);
  const detailsSectionRef = useRef(null);
  const evaluationSectionRef = useRef(null);
  const chatbotSectionRef = useRef(null);
  const outputSectionRef = useRef(null);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const previewBody = previewBodyRef.current;
      if (previewBody) previewBody.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [wizardStep, activeStageIndex, visibleSteps]);

  const activeStage = stages[activeStageIndex];
  const activeRole = formValue(activeStage, "chatbotRole", "chatbotRoleOther");
  const activePersona = personaValuesForStage(activeStage);
  const sourceTitle = isManualSource
    ? sourceLabel(source, catalog.curriculumScenarios || [])
    : "";
  const draftTitle = scenario?.title || (isExistingCopy && copySaved && scenarioName) || "Scenario Preview";
  const draftSummary =
    scenario?.summary ||
    (isManualSource
      ? source?.scenario_text
      : "Complete the scenario builder to generate a summary here.");
  const stateLabel = scenario ? "Generated" : isExistingCopy ? (copySaved ? "Saved copy" : "Unsaved copy") : "Draft";

  return (
    <aside className="livePreviewPanel" aria-label="Live scenario preview">
      <header className="livePreviewHeader">
        <div>
          <span className="livePreviewEyebrow">
            <Layers3 size={14} />
            Scenario Preview
          </span>
          <h2>{draftTitle}</h2>
        </div>
        <span className={`livePreviewState ${scenario ? "generated" : ""} ${isExistingCopy ? "copy" : ""}`}>{stateLabel}</span>
      </header>

      <div className="livePreviewBody" ref={previewBodyRef}>
        <div className="livePreviewSharedContent">
          {isExistingCopy && (
            <div className={`livePreviewCopyNotice ${copySaved ? "saved" : ""}`}>
              <Copy size={16} />
              <div>
                <strong>{copySaved ? "New copy saved" : "Changes will create a new copy"}</strong>
                <p>
                  {copySaved
                    ? "Continue to generate the final scenario packet."
                    : `The original “${originalName || "library scenario"}” stays unchanged. Rename and save this copy in Review & Launch.`}
                </p>
              </div>
            </div>
          )}

          {visibleSteps.has(0) && <PreviewBlock label="Source" complete={Boolean(sourceTitle)} sectionRef={sourceSectionRef} active={wizardStep === 0} onNavigate={isManualSource ? () => onNavigate?.(0) : undefined}>
            <strong>{sourceTitle || "No source selected yet"}</strong>
            <p>
              {isManualSource
                ? source?.scenario_text || "Select a curriculum scenario."
                : "Start in Assessment to define what this scenario should assess."}
            </p>
          </PreviewBlock>}

          {visibleSteps.has(1) && <PreviewBlock label="Assessment" complete={Boolean(form.selectedKpa && (form.competencyBehaviorFocuses || []).length)} sectionRef={kpaSectionRef} active={wizardStep === 1} onNavigate={() => onNavigate?.(1)}>
            <h4 className="livePreviewSectionTitle">{form.selectedKpa || "Select a KPA"}</h4>
            <p className={!competencies.length ? "livePreviewEmpty" : "livePreviewCommaList"}>
              <strong>Focus areas:</strong> {competencies.join(", ") || "None selected yet"}
            </p>
            <p className={!(form.competencyBehaviorFocuses || []).length ? "livePreviewEmpty" : "livePreviewCommaList"}>
              <strong>Behaviors:</strong> {(form.competencyBehaviorFocuses || []).join(", ") || "None selected yet"}
            </p>
          </PreviewBlock>}

          {visibleSteps.has(2) && <PreviewBlock
            label="Scenario Builder"
            complete={Boolean(form.domainType && (form.domainType !== "Military" || form.militaryBranch) && (isManualSource || factors.length))}
            sectionRef={detailsSectionRef}
            active={wizardStep === 2}
            onNavigate={() => onNavigate?.(2)}
          >
            {isManualSource ? (
              <p>Details are inherited from the selected curriculum scenario.</p>
            ) : (
              <>
                <TagList values={factors} emptyText="No scenario factors selected." />
                <TagList values={complexities} emptyText="No additional complexities selected." />
              </>
            )}
            {form.domainType && <p className="livePreviewLabeledItem"><strong>Domain:</strong> {form.domainType}{form.militaryBranch ? ` — ${form.militaryBranch}` : ""}</p>}
            {form.otherDetails && <p className="livePreviewNote">{form.otherDetails}</p>}
          </PreviewBlock>}

          {visibleSteps.has(3) && <PreviewBlock
            label="Generate Scenario"
            complete={Boolean(scenario)}
            sectionRef={evaluationSectionRef}
            active={wizardStep === 3}
            onNavigate={() => onNavigate?.(3)}
          >
            {scenario && <strong>{scenario.title}</strong>}
            <p>{scenario?.summary || "Generate the shared scenario before continuing to Characters."}</p>
          </PreviewBlock>}

          {visibleSteps.has(5) && <PreviewBlock label="Review" complete={Boolean(scenario)} sectionRef={outputSectionRef} active={wizardStep === 5} onNavigate={() => onNavigate?.(5)}>
            {scenario?.avatar_name && <strong>Character: {scenario.avatar_name}</strong>}
            <p className={!scenario ? "livePreviewEmpty" : ""}>{draftSummary}</p>
            {scenario && preview.inContextPersonaSummary && (
              <p className="livePreviewNote">{preview.inContextPersonaSummary}</p>
            )}
          </PreviewBlock>}
        </div>

        {visibleSteps.has(4) && <section ref={chatbotSectionRef} className={`livePreviewChatbotSection ${wizardStep === 4 ? "active" : ""}`} aria-label="Characters">
          <StageTabs
            stages={stages}
            activeStageIndex={activeStageIndex}
            onSelectStage={setActiveStageIndex}
            label="Preview scenario characters"
            variant="preview"
          />

          <PreviewBlock label="Characters" complete={stagePersonaComplete(activeStage)} active={wizardStep === 4} onNavigate={() => onNavigate?.(4)}>
            <strong>{activeRole || `Choose a role for Character ${activeStageIndex + 1}`}</strong>
            <TagList values={activePersona} emptyText={`Character ${activeStageIndex + 1} persona selections will appear here.`} />
            {activeStage.chatbotBehaviorNotes && <p className="livePreviewNote">{activeStage.chatbotBehaviorNotes}</p>}
            {activeStage.personaNotes && <p className="livePreviewNote">{activeStage.personaNotes}</p>}
          </PreviewBlock>
        </section>}

        <div className="livePreviewScrollTail" aria-hidden="true" />
      </div>
    </aside>
  );
}
