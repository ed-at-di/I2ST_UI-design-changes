import { Sparkles } from "lucide-react";

export function EvaluationStep({ form, competencies, scenario, busy, onGenerateScenario }) {
  return (
    <div className="wizardStepBody evaluationStepBody">
      <h2>Evaluation</h2>
      <p className="wizardStepIntro">Generate the shared scenario, review its summary, and regenerate it if the result needs adjustment.</p>

      {scenario && <div className="studioGroup generatedScenarioSummary">
        <span className="studioLabel">Generated scenario summary</span>
        <h3>{scenario.title}</h3>
        <p>{scenario.summary}</p>
        <dl>
          <div><dt>Assessment</dt><dd>{form.selectedKpa}: {competencies.join(", ")}</dd></div>
          <div><dt>Domain</dt><dd>{form.domainType}{form.militaryBranch ? ` — ${form.militaryBranch}` : ""}</dd></div>
          <div><dt>Scenario factors</dt><dd>{form.scenarioFactors.join(", ") || "None selected"}</dd></div>
          <div><dt>Complexities</dt><dd>{form.scenarioComplexities.join(", ") || "None selected"}</dd></div>
        </dl>
      </div>}

      <div className="scenarioGenerationCallout">
        <div><strong>{scenario ? "Scenario generated" : "Generate the shared scenario"}</strong><p>Create the scenario after configuring the character calls, then add persona traits for each character.</p></div>
        <button className="primaryButton" type="button" onClick={onGenerateScenario} disabled={busy}><Sparkles size={16} /><span>{busy ? "Generating..." : scenario ? "Regenerate Scenario" : "Generate Scenario"}</span></button>
      </div>
    </div>
  );
}
