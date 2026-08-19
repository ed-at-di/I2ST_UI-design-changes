import { Plus, Trash2 } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import { EVIDENCE_OPTIONS } from "../../data/scenarioOptions.js";
import { arrayToggle } from "../../lib/scenarioHelpers.js";

function updateList(updateForm, values, key, index, value) {
  updateForm({ [key]: values.map((item, itemIndex) => (itemIndex === index ? value : item)) });
}

function TextList({ label, values, fieldKey, minItems, maxItems, placeholder, info, updateForm, optional = false }) {
  return (
    <div className="studioGroup evaluationSection">
      <div className="evaluationSectionHeader">
        <span className="studioLabel">
          {label}{optional ? <em>(optional)</em> : "*"}
        </span>
        <span>{values.filter((value) => value.trim()).length} of {maxItems}</span>
      </div>
      <div className="repeatableList">
        {values.map((value, index) => (
          <div className="repeatableRow" key={`${fieldKey}-${index}`}>
            <span className="repeatableIndex">{index + 1}</span>
            <textarea value={value} onChange={(event) => updateList(updateForm, values, fieldKey, index, event.target.value)} placeholder={placeholder} />
            <button
              className="iconButton"
              type="button"
              onClick={() => updateForm({ [fieldKey]: values.filter((_, itemIndex) => itemIndex !== index) })}
              disabled={values.length <= minItems}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {values.length < maxItems && (
        <button className="addRowButton" type="button" onClick={() => updateForm({ [fieldKey]: [...values, ""] })}>
          <Plus size={16} />
          <span>Add {label.replace(/s$/, "")}</span>
        </button>
      )}
      <InfoNote>{info}</InfoNote>
    </div>
  );
}

function SuccessCriteriaList({ values, competencies, updateForm }) {
  function updateCriterion(index, patch) {
    updateForm({ successCriteria: values.map((criterion, criterionIndex) => (criterionIndex === index ? { ...criterion, ...patch } : criterion)) });
  }

  return (
    <div className="studioGroup evaluationSection">
      <div className="evaluationSectionHeader">
        <span className="studioLabel">Success Criteria*</span>
        <span>{values.filter((criterion) => criterion.description.trim() && criterion.kpa).length} of 4</span>
      </div>
      <div className="repeatableList">
        {values.map((criterion, index) => (
          <div className="repeatableRow successCriterionRow" key={`success-criterion-${index}`}>
            <span className="repeatableIndex">{index + 1}</span>
            <div className="successCriterionInputs">
              <textarea value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} placeholder="Describe one observable feature of effective performance." />
              <select value={criterion.kpa} onChange={(event) => updateCriterion(index, { kpa: event.target.value })} aria-label={`KPA measured by success criterion ${index + 1}`}>
                <option value="" disabled>Select the KPA this criterion measures</option>
                {competencies.map((competency) => <option key={competency}>{competency}</option>)}
              </select>
            </div>
            <button
              className="iconButton"
              type="button"
              onClick={() => updateForm({ successCriteria: values.filter((_, criterionIndex) => criterionIndex !== index) })}
              disabled={values.length <= 2}
              aria-label={`Remove success criterion ${index + 1}`}
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {values.length < 4 && (
        <button className="addRowButton" type="button" onClick={() => updateForm({ successCriteria: [...values, { description: "", kpa: "" }] })}>
          <Plus size={16} />
          <span>Add Success Criterion</span>
        </button>
      )}
      <InfoNote>{FIELD_INFO.successCriteria}</InfoNote>
    </div>
  );
}

export function EvaluationStep({ form, updateForm, competencies }) {
  const decisionPoints = form.decisionPoints || [];
  const successCriteria = form.successCriteria || [{ description: "", kpa: "" }, { description: "", kpa: "" }];
  const evidenceMethods = form.evidenceMethods || [];
  const criticalErrors = form.criticalErrors || [""];
  const debriefQuestions = form.debriefQuestions || ["", ""];

  function updateDecisionPoint(index, key, value) {
    updateForm({
      decisionPoints: decisionPoints.map((point, pointIndex) => (pointIndex === index ? { ...point, [key]: value } : point)),
    });
  }

  return (
    <div className="wizardStepBody evaluationStepBody">
      <h2>Evaluation</h2>
      <p className="wizardStepIntro">Define the observable decisions and evidence that will show whether the learner met the shared performance objective.</p>

      <div className="studioGroup evaluationSection">
        <div className="evaluationSectionHeader">
          <span className="studioLabel">Decision &amp; Evidence Map*</span>
          <span>{decisionPoints.filter((point) => point.cue.trim() && point.learnerBehavior.trim() && point.consequence.trim()).length} complete</span>
        </div>
        <div className="decisionPointList">
          {decisionPoints.map((point, index) => (
            <fieldset className="decisionPointCard" key={`decision-point-${index}`}>
              <legend>Decision point {index + 1}</legend>
              <label>
                <span>Cue or key moment</span>
                <textarea value={point.cue} onChange={(event) => updateDecisionPoint(index, "cue", event.target.value)} placeholder="What should the learner notice or respond to?" />
              </label>
              <label>
                <span>Observable learner behavior</span>
                <textarea value={point.learnerBehavior} onChange={(event) => updateDecisionPoint(index, "learnerBehavior", event.target.value)} placeholder="What should the learner say, decide, ask, or do?" />
              </label>
              <label>
                <span>Consequence or evidence</span>
                <textarea value={point.consequence} onChange={(event) => updateDecisionPoint(index, "consequence", event.target.value)} placeholder="What outcome or evidence shows the effect of that response?" />
              </label>
              <button
                className="removeDecisionButton"
                type="button"
                onClick={() => updateForm({ decisionPoints: decisionPoints.filter((_, pointIndex) => pointIndex !== index) })}
                disabled={decisionPoints.length <= 1}
              >
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            </fieldset>
          ))}
        </div>
        {decisionPoints.length < 6 && (
          <button className="addRowButton" type="button" onClick={() => updateForm({ decisionPoints: [...decisionPoints, { cue: "", learnerBehavior: "", consequence: "" }] })}>
            <Plus size={16} />
            <span>Add Decision Point</span>
          </button>
        )}
        <InfoNote>{FIELD_INFO.decisionPoints}</InfoNote>
      </div>

      <SuccessCriteriaList values={successCriteria} competencies={competencies} updateForm={updateForm} />

      <div className="studioGroup evaluationSection">
        <span className="studioLabel">Evidence to Capture*</span>
        <div className="checkboxGrid evaluationEvidenceGrid">
          {EVIDENCE_OPTIONS.map((method) => (
            <label className="checkRow" key={method}>
              <input type="checkbox" checked={evidenceMethods.includes(method)} onChange={() => updateForm({ evidenceMethods: arrayToggle(evidenceMethods, method) })} />
              <span>{method}</span>
            </label>
          ))}
        </div>
        {evidenceMethods.includes("Other") && <input value={form.evidenceOther} onChange={(event) => updateForm({ evidenceOther: event.target.value })} placeholder="Other evidence method" />}
        <InfoNote>{FIELD_INFO.evidenceMethods}</InfoNote>
      </div>

      <TextList label="Critical Errors" values={criticalErrors} fieldKey="criticalErrors" minItems={1} maxItems={4} placeholder="Describe an action or omission that should be specifically flagged." info={FIELD_INFO.criticalErrors} updateForm={updateForm} optional />
      <TextList label="Debrief Questions" values={debriefQuestions} fieldKey="debriefQuestions" minItems={2} maxItems={3} placeholder="Ask the learner to connect a decision, its reasoning, and its consequence." info={FIELD_INFO.debriefQuestions} updateForm={updateForm} />
    </div>
  );
}
