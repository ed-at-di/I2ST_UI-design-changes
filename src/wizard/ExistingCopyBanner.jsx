import { CheckCircle2, Copy, Save } from "lucide-react";

export function ExistingCopyBanner({ copyName, originalName, saved, dirty, onNameChange, onSave, isExistingCopy = true }) {
  const trimmedName = copyName.trim();
  const canSave = Boolean(trimmedName && trimmedName !== originalName.trim());

  return (
    <section className={`existingCopyBanner ${saved && !dirty ? "saved" : ""}`} aria-label={isExistingCopy ? "Save copied scenario" : "Save scenario"}>
      <div className="existingCopyMessage">
        <span className="existingCopyIcon">{saved && !dirty ? <CheckCircle2 size={18} /> : isExistingCopy ? <Copy size={18} /> : <Save size={18} />}</span>
        <div>
          <strong>{saved && !dirty ? "Scenario saved" : isExistingCopy ? "Save your own copy" : "Save your scenario"}</strong>
          <p>{isExistingCopy ? "The original library scenario stays unchanged. Save a named copy when you’re ready." : "Give this scenario a name so it’s easy to find again."} You can also continue without saving.</p>
        </div>
      </div>
      <div className="existingCopyControls">
        <label>
          <span>Scenario name</span>
          <input
            value={copyName}
            onChange={(event) => onNameChange(event.target.value)}
            aria-invalid={!canSave}
            placeholder="Enter a new scenario name"
          />
        </label>
        <button className="primaryButton" type="button" onClick={onSave} disabled={!canSave || (saved && !dirty)}>
          <Save size={16} />
          <span>{saved && !dirty ? "Saved" : isExistingCopy ? "Save New Scenario" : "Save Scenario"}</span>
        </button>
      </div>
      {!canSave && <p className="existingCopyValidation">{trimmedName ? "Enter a name that is different from the original scenario." : "Enter a scenario name to save."}</p>}
    </section>
  );
}
