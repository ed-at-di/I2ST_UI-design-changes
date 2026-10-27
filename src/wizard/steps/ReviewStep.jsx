import { CheckCircle2, CircleAlert, FileSpreadsheet, Pencil, Play } from "lucide-react";
import { ExistingCopyBanner } from "../ExistingCopyBanner.jsx";
import { activeScenarioStages } from "../../lib/stageHelpers.js";

export function ReviewStep({
  scenario,
  form,
  onEditSection,
  isManualSource,
  status,
  error,
  busy,
  loading,
  onExport,
  onStartChat,
  copyMustBeSaved,
  isExistingCopy,
  copyName,
  originalName,
  copySaved,
  copyDirty,
  onCopyNameChange,
  onSaveCopy,
}) {
  const stages = activeScenarioStages(form);
  return (
    <div className="wizardStepBody reviewStepBody">
      <h2>Review &amp; Launch</h2>
      <p className="wizardStepIntro">Review the complete scenario and every character persona, then continue to the call lobby.</p>

      {isExistingCopy && (
        <ExistingCopyBanner
          copyName={copyName}
          originalName={originalName}
          saved={copySaved}
          dirty={copyDirty}
          onNameChange={onCopyNameChange}
          onSave={onSaveCopy}
        />
      )}

      {error && (
        <div className="errorBanner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className={`reviewReadiness ${scenario ? "ready" : ""}`}>
        <CheckCircle2 size={22} />
        <div>
          <strong>{scenario ? "Scenario packet generated" : "Ready to generate and launch"}</strong>
          <p>
            {scenario ? "The scenario summary and character selections are shown in the preview." : "Continue to Call Lobby will generate the final packet and prepare the character calls."}
          </p>
          {status && <span>{status}</span>}
        </div>
      </div>

      <div className="reviewSummaryGrid">
        <section className="reviewSummarySection">
          <div><span>Assessment</span><button type="button" onClick={() => onEditSection(1)}><Pencil size={14} /> Edit</button></div>
          <h3>{form.selectedKpa}</h3>
          <p>{(form.competencyBehaviorFocuses || []).join(", ")}</p>
        </section>
        <section className="reviewSummarySection">
          <div><span>Scenario</span><button type="button" onClick={() => onEditSection(2)}><Pencil size={14} /> Edit</button></div>
          <h3>{scenario?.title || "Generate the scenario to review it"}</h3>
          <p>{scenario?.summary || "The generated summary will appear here."}</p>
          <p><strong>Domain:</strong> {form.domainType}{form.militaryBranch ? ` — ${form.militaryBranch}` : ""}</p>
          <p><strong>Factors:</strong> {(form.scenarioFactors || []).join(", ") || "None"}</p>
          <p><strong>Complexities:</strong> {(form.scenarioComplexities || []).join(", ") || "None"}</p>
        </section>
        <section className="reviewSummarySection">
          <div><span>Characters and call order</span><button type="button" onClick={() => onEditSection(4)}><Pencil size={14} /> Edit</button></div>
          <ol>{stages.map((stage, index) => <li key={stage.id}><strong>Call {index + 1}</strong><span>{stage.chatbotRole === "Other" ? stage.chatbotRoleOther : stage.chatbotRole}</span></li>)}</ol>
        </section>
      </div>

      <div className="wizardActions reviewActions">
        <button className="secondaryButton" type="button" onClick={onExport} disabled={busy || loading || !scenario}>
          <FileSpreadsheet size={16} />
          <span>Export Scenario</span>
        </button>
        <button className="primaryButton" type="button" onClick={onStartChat} disabled={busy || loading}>
          <Play size={16} />
          <span>{scenario ? "Continue to Call Lobby" : "Generate & Continue to Call Lobby"}</span>
        </button>
      </div>
    </div>
  );
}
