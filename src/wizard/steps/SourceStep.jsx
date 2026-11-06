import { SelectControl } from "../../components/SelectControl.jsx";
import { sourceLabel, sourceReference } from "../../lib/scenarioHelpers.js";
import { sourceDomain } from "../../data/sourceTemplates.js";
import { normalizeDomainFactors } from "../../data/scenarioOptions.js";

export function SourceStep({ form, updateForm, catalog, source }) {
  const sources = (catalog.curriculumScenarios || []).filter((item) => sourceDomain(item) === form.domainType);

  function changeDomain(domainType) {
    const next = catalog.curriculumScenarios.find((item) => sourceDomain(item) === domainType);
    updateForm({ domainType, militaryBranch: "", curriculumScenarioId: next?.curriculum_scenario_id || "", scenarioFactors: normalizeDomainFactors([next?.category || ""], domainType) });
  }
  return (
    <div className="wizardStepBody">
      <h2>Create from Existing</h2>
      <p className="wizardStepIntro">Select a scenario from the source library to use as the foundation, then customize its roleplay details in the next steps.</p>

      <fieldset className="sourceDomainPicker"><legend className="studioLabel">Scenario domain</legend><div className="domainOptionGrid">{["Civilian", "Military"].map((domain) => <label className={`domainOption ${form.domainType === domain ? "selected" : ""}`} key={domain}><input type="radio" name="source-domain" checked={form.domainType === domain} onChange={() => changeDomain(domain)} /><span>{domain}</span></label>)}</div></fieldset>

      <div className="studioGroup sourceScenarioSection">
        <span className="studioLabel">Source Curriculum Scenario</span>
        <SelectControl className="sourceScenarioSelect" value={source?.curriculum_scenario_id || ""} onChange={(event) => {
          const selected = sources.find((item) => item.curriculum_scenario_id === event.target.value);
          updateForm({ curriculumScenarioId: event.target.value, scenarioFactors: normalizeDomainFactors([selected?.category || ""], form.domainType) });
        }}>
          {sources.map((item) => (
            <option key={item.curriculum_scenario_id} value={item.curriculum_scenario_id}>
              {sourceLabel(item, catalog.curriculumScenarios || [])}
            </option>
          ))}
        </SelectControl>

        <div className="sourceScenarioDetail">
          {source ? (
            <>
              <p>{source.scenario_text}</p>
              <span>{sourceReference(source)}</span>
            </>
          ) : (
            <p>Select a curriculum scenario to continue.</p>
          )}
        </div>
      </div>
      <p className="sourceCopyNotice">You’re working from a copy. The original library scenario stays unchanged. Saving a new scenario is optional.</p>
    </div>
  );
}
