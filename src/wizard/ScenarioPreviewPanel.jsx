import { useEffect, useRef } from "react";
import { Check, Copy, Layers3 } from "lucide-react";
import { StageTabs } from "../components/StageTabs.jsx";
import { formValue, selectedList, sourceLabel } from "../lib/scenarioHelpers.js";
import { activeScenarioStages, personaValuesForStage, stagePersonaComplete } from "../lib/stageHelpers.js";

function PreviewBlock({ label, complete, children, sectionRef }) {
  return (
    <section ref={sectionRef} className={`livePreviewBlock ${complete ? "complete" : ""}`}>
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

  useEffect(() => {
    const previewBody = previewBodyRef.current;
    const sectionByStep = {
      0: sourceSectionRef.current,
      1: kpaSectionRef.current,
      2: detailsSectionRef.current,
      3: evaluationSectionRef.current,
      4: chatbotSectionRef.current,
      5: outputSectionRef.current,
    };
    const activeSection = sectionByStep[wizardStep];
    if (!previewBody || !activeSection || previewBody.scrollHeight <= previewBody.clientHeight) return;

    const bodyTop = previewBody.getBoundingClientRect().top;
    const sectionTop = activeSection.getBoundingClientRect().top;
    const nextScrollTop = previewBody.scrollTop + sectionTop - bodyTop;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewBody.scrollTo({ top: nextScrollTop, behavior: reduceMotion ? "auto" : "smooth" });
  }, [wizardStep, activeStageIndex]);

  const activeStage = stages[activeStageIndex];
  const activeRole = formValue(activeStage, "chatbotRole", "chatbotRoleOther");
  const primaryRole = formValue(stages[0], "chatbotRole", "chatbotRoleOther") || formValue(form, "chatbotRole", "chatbotRoleOther");
  const activePersona = personaValuesForStage(activeStage);
  const sourceTitle = isManualSource
    ? sourceLabel(source, catalog.curriculumScenarios || [])
    : "Create from selected building blocks";
  const draftTitle = scenario?.title || scenarioName || (primaryRole ? `${primaryRole}: Workplace Concern` : "Untitled Scenario");
  const draftSummary =
    scenario?.summary ||
    (isManualSource
      ? source?.scenario_text
      : "The generated title, character, and scenario summary will appear here after the building blocks are reviewed.");
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

          <PreviewBlock label="Source" complete={Boolean(sourceTitle)} sectionRef={sourceSectionRef}>
            <strong>{sourceTitle}</strong>
            <p>
              {isManualSource
                ? source?.scenario_text || "Select a curriculum scenario."
                : "The scenario will be assembled from the training focus, shared details, and stage personas below."}
            </p>
          </PreviewBlock>

          <PreviewBlock label="KPA Focus & Objective" complete={Boolean(competencies.length && form.performanceObjective.trim())} sectionRef={kpaSectionRef}>
            <p className={form.performanceObjective ? "" : "livePreviewEmpty"}>{form.performanceObjective || "Add a performance objective."}</p>
            <TagList values={competencies} emptyText="Add at least one Key Performance Area." />
          </PreviewBlock>

          <PreviewBlock
            label="Scenario Details"
            complete={isManualSource || Boolean(factors.length && form.scenarioSetting.trim() && form.scenarioBackground.trim() && form.scenarioTrigger.trim() && form.scenarioChallenge.trim())}
            sectionRef={detailsSectionRef}
          >
            {isManualSource ? (
              <p>Details are inherited from the selected curriculum scenario.</p>
            ) : (
              <>
                <TagList values={factors} emptyText="No scenario factors selected." />
                <TagList values={complexities} emptyText="No additional complexities selected." />
              </>
            )}
            {[
              ["Setting", form.scenarioSetting],
              ["Background", form.scenarioBackground],
              ["Trigger", form.scenarioTrigger],
              ["Challenge", form.scenarioChallenge],
            ].map(([label, value]) => value && <p className="livePreviewLabeledItem" key={label}><strong>{label}:</strong> {value}</p>)}
            {form.otherDetails && <p className="livePreviewNote">{form.otherDetails}</p>}
          </PreviewBlock>

          <PreviewBlock
            label="Evaluation"
            complete={Boolean(
              form.decisionPoints.some((point) => point.cue.trim() && point.learnerBehavior.trim() && point.consequence.trim()) &&
              form.successCriteria.filter((criterion) => criterion.description.trim() && criterion.kpa).length >= 2 &&
              form.evidenceMethods.length &&
              (!form.evidenceMethods.includes("Other") || form.evidenceOther.trim()) &&
              form.debriefQuestions.filter((value) => value.trim()).length >= 2
            )}
            sectionRef={evaluationSectionRef}
          >
            <strong>{form.successCriteria.filter((criterion) => criterion.description.trim() && criterion.kpa).length || 0} success criteria</strong>
            <TagList values={form.evidenceMethods} emptyText="Choose at least one evidence method." />
            <p>{form.decisionPoints.filter((point) => point.cue.trim() && point.learnerBehavior.trim() && point.consequence.trim()).length} mapped decision points · {form.debriefQuestions.filter((value) => value.trim()).length} debrief questions</p>
          </PreviewBlock>

          <PreviewBlock label="Scenario Output" complete={Boolean(scenario)} sectionRef={outputSectionRef}>
            {scenario?.avatar_name && <strong>Character: {scenario.avatar_name}</strong>}
            <p className={!scenario ? "livePreviewEmpty" : ""}>{draftSummary}</p>
            {scenario && preview.inContextPersonaSummary && (
              <p className="livePreviewNote">{preview.inContextPersonaSummary}</p>
            )}
          </PreviewBlock>
        </div>

        <section ref={chatbotSectionRef} className="livePreviewChatbotSection" aria-labelledby="live-preview-chatbot-heading">
          <h3 id="live-preview-chatbot-heading">Chatbot</h3>
          <StageTabs
            stages={stages}
            activeStageIndex={activeStageIndex}
            onSelectStage={setActiveStageIndex}
            label="Preview chatbot stage"
            variant="preview"
          />

          <PreviewBlock label={`Stage ${activeStageIndex + 1} Persona`} complete={stagePersonaComplete(activeStage)}>
            <strong>{activeRole || `Choose a role for Stage ${activeStageIndex + 1}`}</strong>
            <TagList values={activePersona} emptyText={`Stage ${activeStageIndex + 1} persona selections will appear here.`} />
            {activeStage.chatbotBehaviorNotes && <p className="livePreviewNote">{activeStage.chatbotBehaviorNotes}</p>}
            {activeStage.personaNotes && <p className="livePreviewNote">{activeStage.personaNotes}</p>}
          </PreviewBlock>
        </section>
      </div>
    </aside>
  );
}
