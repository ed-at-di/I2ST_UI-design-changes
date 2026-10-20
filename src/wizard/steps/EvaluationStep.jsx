import { Plus, Sparkles, Trash2 } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";

export function EvaluationStep({ form, updateForm, competencies, scenario, busy, onGenerateScenario }) {
  const decisionPoints = form.decisionPoints || [];

  function updateDecisionPoint(index, key, value) {
    updateForm({ decisionPoints: decisionPoints.map((point, pointIndex) => (pointIndex === index ? { ...point, [key]: value } : point)) });
  }

  function generateDecisionDraft() {
    const focus = competencies[0] || "the selected KPA";
    updateForm({ decisionPoints: [
      {
        cue: "The avatar shares a concern and pauses for the learner's response.",
        learnerBehavior: `Use ${focus} behaviors to acknowledge the concern and ask a focused follow-up question.`,
        consequence: "The avatar's trust and willingness to share details changes based on the learner's response.",
      },
      {
        cue: "New information introduces uncertainty or competing priorities.",
        learnerBehavior: "Clarify the facts, explain the next step, and check the avatar's understanding.",
        consequence: "The conversation either progresses toward a workable outcome or requires additional repair.",
      },
    ] });
  }

  return (
    <div className="wizardStepBody evaluationStepBody">
      <h2>Evaluation</h2>
      <p className="wizardStepIntro">Generate an editable decision map for the selected KPAs, then refine only what this scenario needs.</p>

      <div className="studioGroup evaluationSection">
        <div className="evaluationSectionHeader">
          <span className="studioLabel">Decision &amp; Evidence Map <em>(optional)</em> <InfoNote>{FIELD_INFO.decisionPoints}</InfoNote></span>
          <button className="secondaryButton compactActionButton" type="button" onClick={generateDecisionDraft}><Sparkles size={15} /><span>Generate Draft</span></button>
        </div>
        <div className="decisionPointList">
          {decisionPoints.map((point, index) => (
            <fieldset className="decisionPointCard" key={`decision-point-${index}`}>
              <legend>Decision point {index + 1}</legend>
              <label><span>Cue or key moment</span><textarea value={point.cue} onChange={(event) => updateDecisionPoint(index, "cue", event.target.value)} placeholder="What should the learner notice or respond to?" /></label>
              <label><span>Observable learner behavior</span><textarea value={point.learnerBehavior} onChange={(event) => updateDecisionPoint(index, "learnerBehavior", event.target.value)} placeholder="What should the learner say, decide, ask, or do?" /></label>
              <label><span>Consequence or evidence</span><textarea value={point.consequence} onChange={(event) => updateDecisionPoint(index, "consequence", event.target.value)} placeholder="What outcome or evidence shows the effect of that response?" /></label>
              <button className="removeDecisionButton" type="button" onClick={() => updateForm({ decisionPoints: decisionPoints.filter((_, pointIndex) => pointIndex !== index) })}><Trash2 size={15} /><span>Remove</span></button>
            </fieldset>
          ))}
        </div>
        {decisionPoints.length < 6 && <button className="addRowButton" type="button" onClick={() => updateForm({ decisionPoints: [...decisionPoints, { cue: "", learnerBehavior: "", consequence: "" }] })}><Plus size={16} /><span>Add Decision Point</span></button>}
      </div>

      <div className="scenarioGenerationCallout">
        <div><strong>{scenario ? "Scenario generated" : "Generate the shared scenario"}</strong><p>Create the scenario after configuring the character calls, then add persona traits for each character.</p></div>
        <button className="primaryButton" type="button" onClick={onGenerateScenario} disabled={busy}><Sparkles size={16} /><span>{busy ? "Generating..." : scenario ? "Regenerate Scenario" : "Generate Scenario"}</span></button>
      </div>
    </div>
  );
}
