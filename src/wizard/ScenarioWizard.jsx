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
  { key: "kpa-focus", label: "Assessment" },
  { key: "details", label: "Scenario Builder" },
  { key: "evaluation", label: "Generate Scenario" },
  { key: "persona", label: "Characters" },
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
  visitedSteps,
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [step]);

  const kpaFocusValid = Boolean(form.selectedKpa) && (form.competencyBehaviorFocuses || []).length > 0;
  const setupValid = Boolean(form.domainType) && (form.domainType !== "Military" || Boolean(form.militaryBranch)) && stages.every((stage) => Boolean(stage.chatbotRole && (stage.chatbotRole !== "Other" || stage.chatbotRoleOther.trim())));
  const detailsValid = setupValid && (isManualSource || form.scenarioFactors.length > 0);
  const evaluationValid = Boolean(scenario);
  const personaValid = stages.every(stagePersonaComplete);
  const canAdvanceFrom = { 0: true, 1: kpaFocusValid, 2: detailsValid, 3: evaluationValid, 4: personaValid, 5: true };
  const visibleSteps = wizardStepsForMode(creationMode);
  const currentPosition = Math.max(0, visibleSteps.findIndex((item) => item.index === step));
  const isLastStep = currentPosition === visibleSteps.length - 1;
  const nextStep = visibleSteps[Math.min(visibleSteps.length - 1, currentPosition + 1)];

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
            {step === 3 && <EvaluationStep form={form} updateForm={updateForm} competencies={competencies} scenario={scenario} busy={busy || loading} onGenerateScenario={onRegenerate} />}
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
                  <span>{nextStep ? `Continue to ${nextStep.label}` : "Continue"}</span>
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
          onNavigate={setStep}
          visibleSteps={visitedSteps}
        />
      </main>
    </div>
  );
}
