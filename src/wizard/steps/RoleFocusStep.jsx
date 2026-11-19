import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { SelectControl } from "../../components/SelectControl.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import { KPA_BEHAVIOR_GROUPS, KPA_OPTIONS } from "../../data/scenarioOptions.js";

function behaviorTitle(behavior) {
  return typeof behavior === "string" ? behavior : behavior.title;
}

export function RoleFocusStep({ form, updateForm, competencies }) {
  const [searchText, setSearchText] = useState("");
  const [expandedFocus, setExpandedFocus] = useState("");
  const selectedBehaviors = form.competencyBehaviorFocuses || [];
  const visibleFocusAreas = KPA_BEHAVIOR_GROUPS[form.selectedKpa] || [];
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredFocusAreas = visibleFocusAreas.filter((focus) => (
    !normalizedSearch
    || focus.title.toLowerCase().includes(normalizedSearch)
    || focus.details.some((detail) => behaviorTitle(detail).toLowerCase().includes(normalizedSearch))
  ));

  function selectKpa(nextKpa) {
    const nextFocusAreas = KPA_BEHAVIOR_GROUPS[nextKpa] || [];
    updateForm({
      selectedKpa: nextKpa,
      competencyFocuses: nextFocusAreas.map((focus) => focus.title),
      competencyFocus: nextFocusAreas[0]?.title || "",
      competencyBehaviorFocuses: nextFocusAreas.flatMap((focus) => focus.details.map(behaviorTitle)),
    });
  }

  function toggleKpa(focus) {
    const behaviorTitles = focus.details.map(behaviorTitle);
    const allSelected = behaviorTitles.every((detail) => selectedBehaviors.includes(detail));
    const nextBehaviors = allSelected
      ? selectedBehaviors.filter((detail) => !behaviorTitles.includes(detail))
      : [...new Set([...selectedBehaviors, ...behaviorTitles])];
    const nextKpas = allSelected
      ? competencies.filter((title) => title !== focus.title)
      : [...new Set([...competencies, focus.title])];
    updateForm({ competencyFocuses: nextKpas, competencyFocus: nextKpas[0] || "", competencyBehaviorFocuses: nextBehaviors });
  }

  function toggleBehavior(focus, behavior) {
    const title = behaviorTitle(behavior);
    const nextBehaviors = selectedBehaviors.includes(title)
      ? selectedBehaviors.filter((item) => item !== title)
      : [...selectedBehaviors, title];
    const hasSelectedChild = focus.details.some((detail) => nextBehaviors.includes(behaviorTitle(detail)));
    const nextKpas = hasSelectedChild
      ? [...new Set([...competencies, focus.title])]
      : competencies.filter((title) => title !== focus.title);
    updateForm({ competencyFocuses: nextKpas, competencyFocus: nextKpas[0] || "", competencyBehaviorFocuses: nextBehaviors });
  }

  return (
    <div className="wizardStepBody">
      <h2>Assessment</h2>
      <p className="wizardStepIntro">Choose the interpersonal-skills behaviors this scenario should assess across every character call.</p>

      <label className="studioField kpaSelectionField">
        <span className="studioLabel">KPA* <InfoNote>{FIELD_INFO.selectedKpa}</InfoNote></span>
        <SelectControl value={form.selectedKpa || ""} onChange={(event) => selectKpa(event.target.value)}>
          <option value="" disabled>Select a KPA</option>
          <optgroup label="I2ST assessment rubric">
            {KPA_OPTIONS.map((kpa) => <option key={kpa}>{kpa}</option>)}
          </optgroup>
        </SelectControl>
        <span className="fieldHelperText">Selecting the KPA updates the behavior groups below.</span>
      </label>

      <div className="studioGroup innerStudioGroup competencyGroup">
        <span className="studioLabel">KPA behaviors* <InfoNote>{FIELD_INFO.focusAreas}</InfoNote></span>
        <p className="fieldHelperText">Select a whole subsection or adjust its individual behaviors.</p>

        <div className="assessmentBrowseSearch">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search KPAs and behaviors"
            aria-label="Search KPAs and behaviors"
          />
        </div>

        <div className="kpaHierarchy assessmentBrowseResults">
          {!visibleFocusAreas.length && <p className="kpaEmptyPrompt">Select a KPA to view its behavior subsections.</p>}
          {!!visibleFocusAreas.length && !filteredFocusAreas.length && <p className="kpaEmptyPrompt">No KPAs or behaviors match your search.</p>}
          {filteredFocusAreas.map((focus) => {
            const allSelected = focus.details.every((detail) => selectedBehaviors.includes(behaviorTitle(detail)));
            const selectedCount = focus.details.filter((detail) => selectedBehaviors.includes(behaviorTitle(detail))).length;
            const expanded = expandedFocus === focus.title || Boolean(normalizedSearch);
            return (
              <section className={`kpaOption assessmentBrowseItem ${expanded ? "expanded" : ""}`} key={focus.title}>
                <div className="assessmentBrowseItemHeader">
                  <button
                    className="assessmentBrowseExpand"
                    type="button"
                    onClick={() => setExpandedFocus(expandedFocus === focus.title ? "" : focus.title)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${focus.title}`}
                  >
                    {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                  </button>
                  <label className="checkRow kpaParentRow">
                    <input type="checkbox" checked={allSelected} onChange={() => toggleKpa(focus)} />
                    <span>{focus.title}</span>
                  </label>
                  <span className="assessmentBrowseCount">{selectedCount} of {focus.details.length} selected</span>
                </div>

                {expanded && (
                  <div className="kpaBehaviorList assessmentBrowseBehaviors">
                    {focus.details.map((detail) => {
                      const title = behaviorTitle(detail);
                      const description = typeof detail === "string" ? "" : detail.description;
                      const rateAnchors = typeof detail === "string" ? [] : (detail.rate_anchors || detail.rateAnchors || []);
                      return (
                        <div className="assessmentBehaviorItem" key={title}>
                          <label className="checkRow kpaBehaviorRow">
                            <input type="checkbox" checked={selectedBehaviors.includes(title)} onChange={() => toggleBehavior(focus, detail)} />
                            <span>{title}</span>
                          </label>
                          {description && <p className="assessmentBehaviorDescription">{description}</p>}
                          {!!rateAnchors.length && (
                            <ol className="assessmentRateAnchors">
                              {rateAnchors.map((anchor) => <li key={anchor.id || anchor.rate}><strong>{anchor.rate}</strong><span>{anchor.description}</span></li>)}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
