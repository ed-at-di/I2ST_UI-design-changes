import { useEffect } from "react";
import { Dices } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { SelectControl } from "../../components/SelectControl.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import {
  COMPLEXITY_OPTIONS,
  DOMAIN_OPTIONS,
  FACTOR_OPTIONS,
  MILITARY_BRANCH_OPTIONS,
} from "../../data/scenarioOptions.js";
import { arrayToggle } from "../../lib/scenarioHelpers.js";
import { activeScenarioStages } from "../../lib/stageHelpers.js";

const MILITARY_FACTOR_OPTIONS = ["Race/Ethnicity", "Sex", "Religion", "National Origin", "Other"];

function generatedStructure(domainType, militaryBranch, stages) {
  if (!domainType) return {};
  const roleList = stages.map((stage) => stage.chatbotRole === "Other" ? stage.chatbotRoleOther : stage.chatbotRole).filter(Boolean);
  const setting = domainType === "Military"
    ? `${militaryBranch || "Military"} installation or command workplace`
    : "Civilian organization or federal workplace";
  const stageRoles = roleList.length ? roleList.join(", ") : `${stages.length} scenario character${stages.length === 1 ? "" : "s"}`;
  return {
    scenarioSetting: setting,
    scenarioBackground: `A ${domainType.toLowerCase()} workplace scenario involving ${stageRoles}. Character titles and contextual details should match this domain.`,
    scenarioTrigger: "A workplace concern prompts the learner to begin a structured conversation.",
    scenarioChallenge: "The learner must gather relevant information, communicate clearly, and respond appropriately to the selected scenario factors.",
  };
}

function rankForBranch(branch, index) {
  const ranks = {
    "Air Force": ["Technical Sergeant", "Master Sergeant", "Captain"],
    Army: ["Staff Sergeant", "Sergeant First Class", "Captain"],
    "Coast Guard": ["Petty Officer First Class", "Chief Petty Officer", "Lieutenant"],
    "Marine Corps": ["Staff Sergeant", "Gunnery Sergeant", "Captain"],
    Navy: ["Petty Officer First Class", "Chief Petty Officer", "Lieutenant"],
    "Space Force": ["Technical Sergeant", "Master Sergeant", "Captain"],
  };
  return ranks[branch]?.[index] || "";
}

export function DetailsStep({ form, updateForm, isManualSource }) {
  const stages = activeScenarioStages(form);
  const structure = generatedStructure(form.domainType, form.militaryBranch, stages);

  useEffect(() => {
    if (!form.domainType || Object.entries(structure).every(([key, value]) => form[key] === value)) return;
    updateForm(structure);
  }, [form.domainType, form.militaryBranch, form.stageCount, stages.map((stage) => `${stage.chatbotRole}:${stage.chatbotRoleOther}`).join("|")]);

  function applySetup(patch, nextStages = stages) {
    const nextDomain = patch.domainType ?? form.domainType;
    const nextBranch = patch.militaryBranch ?? form.militaryBranch;
    const rankedStages = nextStages.map((stage, index) => ({ ...stage, domainTitle: nextDomain === "Military" ? rankForBranch(nextBranch, index) : "" }));
    updateForm({ ...patch, stages: rankedStages, ...generatedStructure(nextDomain, nextBranch, rankedStages) });
  }

  function randomizeSelections() {
    const factors = FACTOR_OPTIONS.filter((item) => item !== "Other").sort(() => Math.random() - 0.5).slice(0, 2);
    const complexities = COMPLEXITY_OPTIONS.filter((item) => item !== "Other").sort(() => Math.random() - 0.5).slice(0, 1);
    updateForm({ scenarioFactors: factors, scenarioComplexities: complexities });
  }

  return (
    <div className="wizardStepBody">
      <h2>Scenario Setup</h2>
      <p className="wizardStepIntro">Choose the domain and scenario characteristics. Character count and call order are configured in the Characters step.</p>

      <div className="studioGroup scenarioDomainSection">
        <span className="studioLabel">Scenario Domain* <InfoNote>{FIELD_INFO.scenarioDomain}</InfoNote></span>
        <div className="domainOptionGrid">
          {DOMAIN_OPTIONS.map((domain) => (
            <label className={`domainOption ${form.domainType === domain ? "selected" : ""}`} key={domain}>
              <input type="radio" name="scenario-domain" value={domain} checked={form.domainType === domain} onChange={() => applySetup({ domainType: domain, militaryBranch: domain === "Civilian" ? "" : form.militaryBranch })} />
              <span>{domain}</span>
            </label>
          ))}
        </div>
        {form.domainType === "Military" && (
          <label className="studioField compactField militaryBranchField">
            <span>Military Branch*</span>
            <SelectControl value={form.militaryBranch} onChange={(event) => applySetup({ militaryBranch: event.target.value })}>
              <option value="" disabled>Select a branch</option>
              {MILITARY_BRANCH_OPTIONS.map((branch) => <option key={branch}>{branch}</option>)}
            </SelectControl>
          </label>
        )}
      </div>

      {!isManualSource && (
        <div className="studioGroup generatedInputsSection">
          <div className="sectionTitleRow"><span className="studioLabel">Scenario Characteristics</span><button className="secondaryButton compactActionButton" type="button" onClick={randomizeSelections}><Dices size={15} /><span>Randomize</span></button></div>
          <p className="persistentInfoNote">These structured selections shape the generated scenario while keeping the setting consistent with the selected domain.</p>
          <div className="studioGroup innerStudioGroup factorGroup">
            <span className="studioLabel">Scenario Factors <InfoNote>{FIELD_INFO.scenarioFactors}</InfoNote></span>
            <div className="checkboxGrid">
              {(form.domainType === "Military" ? MILITARY_FACTOR_OPTIONS : FACTOR_OPTIONS).map((factor) => factor === "Other" ? (
                <div className="checkRow otherRow" key={factor}><label className="otherToggle"><input type="checkbox" checked={form.scenarioFactors.includes(factor)} onChange={() => updateForm({ scenarioFactors: arrayToggle(form.scenarioFactors, factor) })} /><span>{factor}</span></label><input className="otherFactor" value={form.otherFactor} onChange={(event) => updateForm({ otherFactor: event.target.value })} disabled={!form.scenarioFactors.includes(factor)} placeholder="Other" /></div>
              ) : <label className="checkRow" key={factor}><input type="checkbox" checked={form.scenarioFactors.includes(factor)} onChange={() => updateForm({ scenarioFactors: arrayToggle(form.scenarioFactors, factor) })} /><span>{factor}</span></label>)}
            </div>
          </div>
          <div className="studioGroup innerStudioGroup complexityGroup">
            <span className="studioLabel">Additional Complexities <InfoNote>{FIELD_INFO.scenarioComplexities}</InfoNote></span>
            <div className="complexityStack">
              {COMPLEXITY_OPTIONS.map((complexity) => complexity === "Other" ? (
                <div className="checkRow otherRow complexityOtherRow" key={complexity}><label className="otherToggle"><input type="checkbox" checked={form.scenarioComplexities.includes(complexity)} onChange={() => updateForm({ scenarioComplexities: arrayToggle(form.scenarioComplexities, complexity) })} /><span>{complexity}</span></label><input className="otherFactor" value={form.otherComplexity} onChange={(event) => updateForm({ otherComplexity: event.target.value })} disabled={!form.scenarioComplexities.includes(complexity)} placeholder="Other complexity" /></div>
              ) : <label className="checkRow" key={complexity}><input type="checkbox" checked={form.scenarioComplexities.includes(complexity)} onChange={() => updateForm({ scenarioComplexities: arrayToggle(form.scenarioComplexities, complexity) })} /><span>{complexity}</span></label>)}
            </div>
          </div>
        </div>
      )}

      <label className="studioField"><span className="studioLabel">Other Details <em>(optional)</em> <InfoNote>{FIELD_INFO.otherDetails}</InfoNote></span><textarea value={form.otherDetails} onChange={(event) => updateForm({ otherDetails: event.target.value })} placeholder="Other details related to the scenario not captured in the selections above." /></label>
    </div>
  );
}
