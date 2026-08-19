import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SourceStep } from "./steps/SourceStep.jsx";
import { RoleFocusStep } from "./steps/RoleFocusStep.jsx";
import { DetailsStep } from "./steps/DetailsStep.jsx";
import { EvaluationStep } from "./steps/EvaluationStep.jsx";
import { PersonaStep } from "./steps/PersonaStep.jsx";
import { ReviewStep } from "./steps/ReviewStep.jsx";
import { ScenarioPreviewPanel } from "./ScenarioPreviewPanel.jsx";
import { activeScenarioStages, stagePersonaComplete } from "../lib/stageHelpers.js";

export const STEPS = [
  { key: "source", label: "Source" },
  { key: "kpa-focus", label: "KPA Focus" },
  { key: "details", label: "Details" },
  { key: "evaluation", label: "Evaluation" },
  { key: "persona", label: "Chatbot" },
  { key: "review", label: "Review" },
];

export function wizardStepsForMode(creationMode) {
  return STEPS.map((item, index) => ({ ...item, index })).filter(
    (item) => creationMode !== "new" || item.key !== "source"
  );
}

export function ScenarioWizard({
  step,
  setStep,
  form,
  updateForm,
  catalog,
  source,
  isManualSource,
  competencies,
  scenario,
  preview,
  status,
  error,
  busy,
  loading,
  onRegenerate,
  onExport,
  onStartChat,
  creationMode,
  existingCopyName,
  existingOriginalName,
  existingCopySaved,
  existingCopyDirty,
  onExistingCopyNameChange,
  onSaveExistingCopy,
}) {
  const stages = activeScenarioStages(form);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    setActiveStageIndex((current) => Math.min(current, stages.length - 1));
  }, [stages.length]);

  const kpaFocusValid = competencies.length > 0 && Boolean(form.performanceObjective.trim());
  const detailsValid = isManualSource || (
    form.scenarioFactors.length > 0 &&
    [form.scenarioSetting, form.scenarioBackground, form.scenarioTrigger, form.scenarioChallenge].every((value) => value.trim())
  );
  const evaluationValid =
    form.decisionPoints.some((point) => point.cue.trim() && point.learnerBehavior.trim() && point.consequence.trim()) &&
    form.successCriteria.filter((criterion) => criterion.description.trim() && criterion.kpa).length >= 2 &&
    form.evidenceMethods.length > 0 &&
    (!form.evidenceMethods.includes("Other") || Boolean(form.evidenceOther.trim())) &&
    form.debriefQuestions.filter((value) => value.trim()).length >= 2;
  const personaValid = stages.every(stagePersonaComplete);
  const canAdvanceFrom = { 0: true, 1: kpaFocusValid, 2: detailsValid, 3: evaluationValid, 4: personaValid, 5: true };
  const visibleSteps = wizardStepsForMode(creationMode);
  const currentPosition = Math.max(0, visibleSteps.findIndex((item) => item.index === step));
  const isLastStep = currentPosition === visibleSteps.length - 1;

  function goBack() {
    setStep(visibleSteps[Math.max(0, currentPosition - 1)].index);
  }

  function goNext() {
    if (!canAdvanceFrom[step]) return;
    setStep(visibleSteps[Math.min(visibleSteps.length - 1, currentPosition + 1)].index);
  }

  return (
    <div className="wizardShell">
      <main className="wizardWorkspace">
        <section className="wizardBuilderColumn">
          <div className="wizardCard">
            {step === 0 && <SourceStep updateForm={updateForm} catalog={catalog} source={source} />}
            {step === 1 && <RoleFocusStep form={form} updateForm={updateForm} competencies={competencies} />}
            {step === 2 && <DetailsStep form={form} updateForm={updateForm} isManualSource={isManualSource} />}
            {step === 3 && <EvaluationStep form={form} updateForm={updateForm} competencies={competencies} />}
            {step === 4 && (
              <PersonaStep
                form={form}
                updateForm={updateForm}
                activeStageIndex={activeStageIndex}
                setActiveStageIndex={setActiveStageIndex}
              />
            )}
            {step === 5 && (
              <ReviewStep
                scenario={scenario}
                isManualSource={isManualSource}
                status={status}
                error={error}
                busy={busy}
                loading={loading}
                onRegenerate={onRegenerate}
                onExport={onExport}
                onStartChat={onStartChat}
                copyMustBeSaved={creationMode === "existing" && !existingCopySaved}
                isExistingCopy={creationMode === "existing"}
                copyName={existingCopyName}
                originalName={existingOriginalName}
                copySaved={existingCopySaved}
                copyDirty={existingCopyDirty}
                onCopyNameChange={onExistingCopyNameChange}
                onSaveCopy={onSaveExistingCopy}
              />
            )}

            {!isLastStep && (
              <div className="wizardFooter">
                <button className="secondaryButton" type="button" onClick={goBack} disabled={currentPosition === 0}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button className="primaryButton" type="button" onClick={goNext} disabled={!canAdvanceFrom[step]}>
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {isLastStep && (
              <div className="wizardFooter">
                <button className="secondaryButton" type="button" onClick={goBack}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <ScenarioPreviewPanel
          wizardStep={step}
          activeStageIndex={activeStageIndex}
          setActiveStageIndex={setActiveStageIndex}
          form={form}
          catalog={catalog}
          source={source}
          isManualSource={isManualSource}
          competencies={competencies}
          scenario={scenario}
          preview={preview}
          scenarioName={creationMode === "existing" ? existingCopyName : ""}
          isExistingCopy={creationMode === "existing"}
          copySaved={existingCopySaved}
          originalName={existingOriginalName}
        />
      </main>
    </div>
  );
}
