import { InfoNote } from "../../components/InfoNote.jsx";
import { SelectControl } from "../../components/SelectControl.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import { KPA_BEHAVIOR_GROUPS, KPA_OPTIONS } from "../../data/scenarioOptions.js";

export function RoleFocusStep({ form, updateForm, competencies }) {
  const selectedBehaviors = form.competencyBehaviorFocuses || [];
  const visibleFocusAreas = KPA_BEHAVIOR_GROUPS[form.selectedKpa] || [];

  function selectKpa(nextKpa) {
    const nextFocusAreas = KPA_BEHAVIOR_GROUPS[nextKpa] || [];
    updateForm({
      selectedKpa: nextKpa,
      competencyFocuses: nextFocusAreas.map((focus) => focus.title),
      competencyFocus: nextFocusAreas[0]?.title || "",
      competencyBehaviorFocuses: nextFocusAreas.flatMap((focus) => focus.details),
    });
  }

  function toggleKpa(focus) {
    const allSelected = focus.details.every((detail) => selectedBehaviors.includes(detail));
    const nextBehaviors = allSelected
      ? selectedBehaviors.filter((detail) => !focus.details.includes(detail))
      : [...new Set([...selectedBehaviors, ...focus.details])];
    const nextKpas = allSelected
      ? competencies.filter((title) => title !== focus.title)
      : [...new Set([...competencies, focus.title])];
    updateForm({ competencyFocuses: nextKpas, competencyFocus: nextKpas[0] || "", competencyBehaviorFocuses: nextBehaviors });
  }

  function toggleBehavior(focus, behavior) {
    const nextBehaviors = selectedBehaviors.includes(behavior)
      ? selectedBehaviors.filter((item) => item !== behavior)
      : [...selectedBehaviors, behavior];
    const hasSelectedChild = focus.details.some((detail) => nextBehaviors.includes(detail));
    const nextKpas = hasSelectedChild
      ? [...new Set([...competencies, focus.title])]
      : competencies.filter((title) => title !== focus.title);
    updateForm({ competencyFocuses: nextKpas, competencyFocus: nextKpas[0] || "", competencyBehaviorFocuses: nextBehaviors });
  }

  return (
    <div className="wizardStepBody">
      <h2>Assessment</h2>
      <p className="wizardStepIntro">Choose the mock rubric and behaviors this scenario should assess across every character call.</p>

      <label className="studioField kpaSelectionField">
        <span className="studioLabel">KPA* <InfoNote>{FIELD_INFO.selectedKpa}</InfoNote></span>
        <SelectControl value={form.selectedKpa || ""} onChange={(event) => selectKpa(event.target.value)}>
          <option value="" disabled>Select a KPA</option>
          <optgroup label="Mock interpersonal-skills rubric">
            {KPA_OPTIONS.map((kpa) => <option key={kpa}>{kpa}</option>)}
          </optgroup>
        </SelectControl>
        <span className="fieldHelperText">Prototype rubric data. Selecting a KPA updates the behavior groups below.</span>
      </label>

      <div className="studioGroup innerStudioGroup competencyGroup">
        <span className="studioLabel">KPA behaviors* <InfoNote>{FIELD_INFO.focusAreas}</InfoNote></span>
        <p className="fieldHelperText">Select a whole subsection or adjust its individual behaviors.</p>
        <div className="kpaHierarchy">
          {!visibleFocusAreas.length && <p className="kpaEmptyPrompt">Select a KPA to view its behavior subsections.</p>}
          {visibleFocusAreas.map((focus) => (
            <div className="kpaOption" key={focus.title}>
              <label className="checkRow kpaParentRow">
                <input
                  type="checkbox"
                  checked={focus.details.every((detail) => selectedBehaviors.includes(detail))}
                  onChange={() => toggleKpa(focus)}
                />
                <span>{focus.title}</span>
              </label>
              <div className="kpaBehaviorList">
                {focus.details.map((detail) => (
                  <label className="checkRow kpaBehaviorRow" key={detail}>
                    <input type="checkbox" checked={selectedBehaviors.includes(detail)} onChange={() => toggleBehavior(focus, detail)} />
                    <span>{detail}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
