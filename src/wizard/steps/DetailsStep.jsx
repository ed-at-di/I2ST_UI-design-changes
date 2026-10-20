import { useEffect } from "react";
import { Dices, Plus, Trash2 } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { SelectControl } from "../../components/SelectControl.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import {
  CHATBOT_ROLES,
  COMPLEXITY_OPTIONS,
  DOMAIN_OPTIONS,
  FACTOR_OPTIONS,
  MILITARY_BRANCH_OPTIONS,
} from "../../data/scenarioOptions.js";
import { arrayToggle } from "../../lib/scenarioHelpers.js";
import { activeScenarioStages, ensureScenarioStages, legacyPersonaPatch } from "../../lib/stageHelpers.js";

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

  function addStage() {
    if (stages.length >= 3) return;
    const stageCount = stages.length + 1;
    const nextStages = ensureScenarioStages(form, stageCount).slice(0, stageCount);
    applySetup({ stageCount, stages: nextStages }, nextStages);
  }

  function removeStage(index) {
    if (stages.length <= 1) return;
    const nextStages = stages
      .filter((_, stageIndex) => stageIndex !== index)
      .map((stage, stageIndex) => ({ ...stage, id: `stage-${stageIndex + 1}`, name: `Stage ${stageIndex + 1}` }));
    applySetup({
      stageCount: nextStages.length,
      stages: nextStages,
      ...legacyPersonaPatch(nextStages[0]),
    }, nextStages);
  }

  function updateStage(index, patch) {
    const allStages = ensureScenarioStages(form, stages.length);
    const updatedStage = { ...allStages[index], ...patch };
    const nextStages = allStages.map((stage, stageIndex) => stageIndex === index ? updatedStage : stage);
    applySetup({ stages: nextStages, ...(index === 0 ? legacyPersonaPatch(updatedStage) : {}) }, nextStages);
  }

  function stageUsingRole(role, currentIndex) {
    return stages.findIndex((stage, index) => index !== currentIndex && role !== "Other" && stage.chatbotRole === role);
  }

  function randomizeSelections() {
    const factors = FACTOR_OPTIONS.filter((item) => item !== "Other").sort(() => Math.random() - 0.5).slice(0, 2);
    const complexities = COMPLEXITY_OPTIONS.filter((item) => item !== "Other").sort(() => Math.random() - 0.5).slice(0, 1);
    updateForm({ scenarioFactors: factors, scenarioComplexities: complexities });
  }

  return (
    <div className="wizardStepBody">
      <h2>Scenario Setup</h2>
      <p className="wizardStepIntro">Set the character calls and domain first. The shared scenario structure will be populated automatically from these selections.</p>

      <div className="studioGroup scenarioSetupSection">
        <div className="stageSetupHeader">
          <span className="studioLabel">Characters &amp; Call Order <InfoNote>{FIELD_INFO.scenarioParticipants}</InfoNote></span>
          {stages.length < 3 && <button className="secondaryButton compactActionButton" type="button" onClick={addStage}><Plus size={15} /><span>Add Character</span></button>}
        </div>
        <div className="scenarioParticipantGrid">
          {stages.map((stage, index) => (
            <div className="scenarioParticipantCard" key={stage.id}>
              <div className="scenarioParticipantCardHeader">
                <strong>Call {index + 1}</strong>
                {index === 0 && <small>Required complainant</small>}
                {stages.length > 1 && index > 0 && <button className="removeStageButton" type="button" onClick={() => removeStage(index)} aria-label={`Remove character ${index + 1}`} title={`Remove character ${index + 1}`}><Trash2 size={15} /></button>}
              </div>
              <label className="studioField compactField">
                <span>Role*</span>
                <SelectControl value={stage.chatbotRole} onChange={(event) => updateStage(index, { chatbotRole: event.target.value })} disabled={index === 0}>
                  <option value="" disabled>Select a role</option>
                  {CHATBOT_ROLES.map((role) => {
                    const selectedStage = stageUsingRole(role, index);
                    return <option key={role} value={role} disabled={selectedStage >= 0}>{role}{selectedStage >= 0 ? ` — Call ${selectedStage + 1}` : ""}</option>;
                  })}
                </SelectControl>
              </label>
              {stage.chatbotRole === "Other" && <input value={stage.chatbotRoleOther} onChange={(event) => updateStage(index, { chatbotRoleOther: event.target.value })} placeholder="Custom role" />}
              {form.domainType === "Military" && form.militaryBranch && <p className="assignedDomainTitle"><span>Assigned rank</span><strong>{stage.domainTitle || rankForBranch(form.militaryBranch, index)}</strong></p>}
            </div>
          ))}
        </div>
      </div>

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

      <div className="studioGroup scenarioStructureSection">
        <span className="studioLabel">Generated Scenario Structure <InfoNote>{FIELD_INFO.generatedScenarioStructure}</InfoNote></span>
        <div className="generatedStructureGrid">
          {[["Setting", form.scenarioSetting], ["Background", form.scenarioBackground], ["Trigger", form.scenarioTrigger], ["Challenge", form.scenarioChallenge]].map(([label, value]) => (
            <div className="generatedStructureCard" key={label}><strong>{label}</strong><p>{value || "Complete the character and domain selections above."}</p></div>
          ))}
        </div>
      </div>

      {!isManualSource && (
        <div className="studioGroup generatedInputsSection">
          <div className="sectionTitleRow"><span className="studioLabel">Scenario Characteristics</span><button className="secondaryButton compactActionButton" type="button" onClick={randomizeSelections}><Dices size={15} /><span>Randomize</span></button></div>
          <p className="persistentInfoNote">These structured selections shape the generated scenario while keeping the setting consistent with the selected domain.</p>
          <div className="studioGroup innerStudioGroup factorGroup">
            <span className="studioLabel">Scenario Factors <InfoNote>{FIELD_INFO.scenarioFactors}</InfoNote></span>
            <div className="checkboxGrid">
              {FACTOR_OPTIONS.map((factor) => factor === "Other" ? (
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
