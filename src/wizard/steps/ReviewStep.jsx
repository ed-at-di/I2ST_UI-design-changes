import { useState } from "react";
import { ArrowRight, ChevronLeft, CircleAlert, Download, Pencil, Save, X } from "lucide-react";
import { namedScenarioStages } from "../../lib/stageHelpers.js";
import { formValue, selectedList } from "../../lib/scenarioHelpers.js";

export function ReviewStep({
  scenario,
  form,
  onEditSection,
  error,
  busy,
  loading,
  onExport,
  onStartChat,
  onBack,
  copyMustBeSaved,
  isExistingCopy,
  copyName,
  originalName,
  copySaved,
  copyDirty,
  onCopyNameChange,
  onSaveCopy,
}) {
  const stages = namedScenarioStages(form, scenario);
  const reviewTitle = `${originalName || scenario?.title || "Scenario draft"} (edited)`;
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState(reviewTitle);
  const canSave = Boolean(saveName.trim() && saveName.trim() !== originalName?.trim());

  function openSaveModal() {
    setSaveName(copySaved && !copyDirty ? copyName : reviewTitle);
    setSaveModalOpen(true);
  }

  function confirmSave() {
    if (!canSave) return;
    onSaveCopy(saveName.trim());
    setSaveModalOpen(false);
  }

  function editOnKeyboard(event, step) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onEditSection(step);
  }

  return (
    <div className="wizardStepBody reviewStepBody">
      {error && (
        <div className="errorBanner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="reviewDocumentLayout">
        <div className="reviewDocumentColumn">
          <article className="reviewPaper" aria-label="Scenario review packet">
        <div className="reviewPaperTitleBlock">
          <h3>{reviewTitle}</h3>
          <div className="reviewTitleActions">
            <button className="secondaryButton" type="button" onClick={openSaveModal} disabled={busy || loading || !scenario}>
              <Save size={16} />
              <span>Save edited scenario</span>
            </button>
            <button className="primaryButton" type="button" onClick={onStartChat} disabled={busy || loading}>
              <span>{scenario ? "Approve & Continue" : "Generate & Continue"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="reviewPaperColumns">
          <aside className="reviewPaperSidebar">
            <section className="reviewDocumentSection compact" role="button" tabIndex={0} onClick={() => onEditSection(1)} onKeyDown={(event) => editOnKeyboard(event, 1)}>
              <div className="reviewDocumentSectionHeading"><span>Assessment</span><span className="reviewEditCue"><Pencil size={13} /> Edit</span></div>
              <h4>{form.selectedKpa}</h4>
              <ul>{(form.competencyBehaviorFocuses || []).map((behavior) => <li key={behavior}>{behavior}</li>)}</ul>
            </section>

            <section className="reviewDocumentSection compact" role="button" tabIndex={0} onClick={() => onEditSection(2)} onKeyDown={(event) => editOnKeyboard(event, 2)}>
              <div className="reviewDocumentSectionHeading"><span>Scenario details</span><span className="reviewEditCue"><Pencil size={13} /> Edit</span></div>
              <dl className="reviewSidebarFacts">
                <div><dt>Domain</dt><dd>{form.domainType}{form.militaryBranch ? ` — ${form.militaryBranch}` : ""}</dd></div>
                <div><dt>Factors</dt><dd>{selectedList(form.scenarioFactors || [], form.otherFactor).join(", ") || "None"}</dd></div>
                <div><dt>Complexities</dt><dd>{selectedList(form.scenarioComplexities || [], form.otherComplexity).join(", ") || "None"}</dd></div>
                {form.otherDetails && <div><dt>Other details</dt><dd>{form.otherDetails}</dd></div>}
              </dl>
            </section>
          </aside>

          <main className="reviewPaperMain">
            <section className="reviewDocumentSection narrative" role="button" tabIndex={0} onClick={() => onEditSection(3)} onKeyDown={(event) => editOnKeyboard(event, 3)}>
              <div className="reviewDocumentSectionHeading"><span>Scenario summary</span><span className="reviewEditCue"><Pencil size={13} /> Edit</span></div>
              <p>{scenario?.summary || "The generated scenario summary will appear here."}</p>
            </section>

            <section className="reviewDocumentSection calls" role="button" tabIndex={0} onClick={() => onEditSection(4)} onKeyDown={(event) => editOnKeyboard(event, 4)}>
              <div className="reviewDocumentSectionHeading"><span>Character calls</span><span className="reviewEditCue"><Pencil size={13} /> Edit</span></div>
              <ol>{stages.map((stage, index) => <li key={stage.id}><strong>{String(index + 1).padStart(2, "0")}</strong><div>
                <span>{stage.characterName}</span><small>{formValue(stage, "chatbotRole", "chatbotRoleOther")} · Call {index + 1} of {stages.length}</small>
                <dl className="reviewCharacterFacts">
                  {[["Persona style", "personaStyle", "personaStyleOther"], ["Emotional start", "personaEmotionalState", "personaEmotionalStateOther"], ["Trust level", "personaTrustLevel", "personaTrustLevelOther"], ["Communication", "personaCommunicationStyle", "personaCommunicationStyleOther"], ["Preferred outcome", "personaPrimaryConcern", "personaPrimaryConcernOther"]].map(([label, key, otherKey]) => <div key={key}><dt>{label}</dt><dd>{formValue(stage, key, otherKey) || "Not selected"}</dd></div>)}
                  <div><dt>Behavior notes</dt><dd>{stage.chatbotBehaviorNotes || "No additional notes"}</dd></div>
                </dl>
              </div></li>)}</ol>
            </section>
          </main>
        </div>

          </article>

          <div className="wizardActions reviewActions">
            <button className="secondaryButton reviewBackButton" type="button" onClick={onBack}>
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button className="secondaryButton" type="button" onClick={onExport} disabled={busy || loading || !scenario}>
              <Download size={16} />
              <span>Download packet</span>
            </button>
          </div>
        </div>
      </div>

      {saveModalOpen && <div className="reviewSaveModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveModalOpen(false); }}>
        <section className="reviewSaveModal" role="dialog" aria-modal="true" aria-labelledby="review-save-title">
          <div className="reviewSaveModalHeader"><div><span>Save edited scenario</span><h2 id="review-save-title">Name your scenario</h2></div><button type="button" aria-label="Close save dialog" onClick={() => setSaveModalOpen(false)}><X size={20} /></button></div>
          <label><span>Scenario name</span><input autoFocus value={saveName} onChange={(event) => setSaveName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") confirmSave(); }} /></label>
          {!canSave && <p>Enter a scenario name that is different from the original.</p>}
          <div className="reviewSaveModalActions"><button className="secondaryButton" type="button" onClick={() => setSaveModalOpen(false)}>Cancel</button><button className="primaryButton" type="button" onClick={confirmSave} disabled={!canSave}><Save size={16} /><span>Save scenario</span></button></div>
        </section>
      </div>}
    </div>
  );
}
