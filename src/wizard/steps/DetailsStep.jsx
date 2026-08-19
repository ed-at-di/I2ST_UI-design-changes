import { InfoNote } from "../../components/InfoNote.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import { COMPLEXITY_OPTIONS, FACTOR_OPTIONS } from "../../data/scenarioOptions.js";
import { arrayToggle } from "../../lib/scenarioHelpers.js";

export function DetailsStep({ form, updateForm, isManualSource }) {
  return (
    <div className="wizardStepBody">
      <h2>Scenario Details</h2>
      <p className="wizardStepIntro">
        {isManualSource
          ? "The source supplies the base scenario. Use these fields when you need to clarify or adapt its shared setting, background, trigger, or challenge."
          : "Define the shared situation first, then layer in the workplace factors and purposeful complexities it should reflect."}
      </p>

      <div className="studioGroup scenarioStructureSection">
        <span className="studioLabel">Scenario Structure</span>
        <div className="scenarioStructureGrid">
          <label className="studioField">
            <span className="studioLabel">Setting{!isManualSource && "*"}</span>
            <textarea value={form.scenarioSetting} onChange={(event) => updateForm({ scenarioSetting: event.target.value })} placeholder="Where and when does this take place?" />
            <InfoNote>{FIELD_INFO.scenarioSetting}</InfoNote>
          </label>
          <label className="studioField">
            <span className="studioLabel">Background{!isManualSource && "*"}</span>
            <textarea value={form.scenarioBackground} onChange={(event) => updateForm({ scenarioBackground: event.target.value })} placeholder="What does the learner know at the outset?" />
            <InfoNote>{FIELD_INFO.scenarioBackground}</InfoNote>
          </label>
          <label className="studioField">
            <span className="studioLabel">Trigger{!isManualSource && "*"}</span>
            <textarea value={form.scenarioTrigger} onChange={(event) => updateForm({ scenarioTrigger: event.target.value })} placeholder="What starts the interaction?" />
            <InfoNote>{FIELD_INFO.scenarioTrigger}</InfoNote>
          </label>
          <label className="studioField">
            <span className="studioLabel">Challenge{!isManualSource && "*"}</span>
            <textarea value={form.scenarioChallenge} onChange={(event) => updateForm({ scenarioChallenge: event.target.value })} placeholder="What makes the situation difficult or consequential?" />
            <InfoNote>{FIELD_INFO.scenarioChallenge}</InfoNote>
          </label>
        </div>
      </div>

      {!isManualSource && (
        <div className="studioGroup generatedInputsSection">
          <span className="studioLabel">Create From Selection Inputs</span>

          <div className="studioGroup innerStudioGroup factorGroup">
            <span className="studioLabel">Select Scenario Factors</span>
            <div className="checkboxGrid">
              {FACTOR_OPTIONS.map((factor) =>
                factor === "Other" ? (
                  <div className="checkRow otherRow" key={factor}>
                    <label className="otherToggle">
                      <input type="checkbox" checked={form.scenarioFactors.includes(factor)} onChange={() => updateForm({ scenarioFactors: arrayToggle(form.scenarioFactors, factor) })} />
                      <span>{factor}</span>
                    </label>
                    <input className="otherFactor" value={form.otherFactor} onChange={(event) => updateForm({ otherFactor: event.target.value })} disabled={!form.scenarioFactors.includes(factor)} placeholder="Other" />
                  </div>
                ) : (
                  <label className="checkRow" key={factor}>
                    <input type="checkbox" checked={form.scenarioFactors.includes(factor)} onChange={() => updateForm({ scenarioFactors: arrayToggle(form.scenarioFactors, factor) })} />
                    <span>{factor}</span>
                  </label>
                )
              )}
            </div>
            <InfoNote>{FIELD_INFO.scenarioFactors}</InfoNote>
          </div>

          <div className="studioGroup innerStudioGroup complexityGroup">
            <span className="studioLabel">Select Any Additional Scenario Complexities:</span>
            <div className="complexityStack">
              {COMPLEXITY_OPTIONS.map((complexity) =>
                complexity === "Other" ? (
                  <div className="checkRow otherRow complexityOtherRow" key={complexity}>
                    <label className="otherToggle">
                      <input type="checkbox" checked={form.scenarioComplexities.includes(complexity)} onChange={() => updateForm({ scenarioComplexities: arrayToggle(form.scenarioComplexities, complexity) })} />
                      <span>{complexity}</span>
                    </label>
                    <input className="otherFactor" value={form.otherComplexity} onChange={(event) => updateForm({ otherComplexity: event.target.value })} disabled={!form.scenarioComplexities.includes(complexity)} placeholder="Other complexity" />
                  </div>
                ) : (
                  <label className="checkRow" key={complexity}>
                    <input type="checkbox" checked={form.scenarioComplexities.includes(complexity)} onChange={() => updateForm({ scenarioComplexities: arrayToggle(form.scenarioComplexities, complexity) })} />
                    <span>{complexity}</span>
                  </label>
                )
              )}
            </div>
            <InfoNote>{FIELD_INFO.scenarioComplexities}</InfoNote>
          </div>
        </div>
      )}

      <label className="studioField">
        <span className="studioLabel">Describe Other Details <em>(optional)</em></span>
        <textarea value={form.otherDetails} onChange={(event) => updateForm({ otherDetails: event.target.value })} placeholder="Other details related to the scenario" />
        <InfoNote>{FIELD_INFO.otherDetails}</InfoNote>
      </label>
    </div>
  );
}
