import { Dices, Plus, Trash2 } from "lucide-react";
import { InfoNote } from "../../components/InfoNote.jsx";
import { SelectControl } from "../../components/SelectControl.jsx";
import { StageTabs } from "../../components/StageTabs.jsx";
import { FIELD_INFO } from "../../data/fieldInfo.js";
import {
  CHATBOT_ROLES,
  PERSONA_COMMUNICATION_STYLE_OPTIONS,
  PERSONA_EMOTIONAL_STATE_OPTIONS,
  PERSONA_PRIMARY_CONCERN_OPTIONS,
  PERSONA_STYLE_OPTIONS,
  PERSONA_TRUST_LEVEL_OPTIONS,
} from "../../data/scenarioOptions.js";
import {
  activeScenarioStages,
  ensureScenarioStages,
  legacyPersonaPatch,
  stageCountFromForm,
  stagePersonaComplete,
} from "../../lib/stageHelpers.js";

function PersonaSelect({ label, value, options, otherValue, onChange, onOtherChange, placeholder, info }) {
  const isOther = value === "Other";
  return (
    <label className="personaSelect">
      <span>{label}</span>
      <SelectControl value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectControl>
      {isOther && <input value={otherValue} onChange={(event) => onOtherChange(event.target.value)} placeholder={placeholder} />}
      <InfoNote>{info}</InfoNote>
    </label>
  );
}

export function PersonaStep({ form, updateForm, activeStageIndex, setActiveStageIndex }) {
  const stageCount = stageCountFromForm(form);
  const stages = activeScenarioStages(form);

  const activeStage = stages[activeStageIndex];

  function updateStage(patch) {
    const allStages = ensureScenarioStages(form, stageCount);
    const updatedStage = { ...allStages[activeStageIndex], ...patch };
    const nextStages = allStages.map((stage, index) => (index === activeStageIndex ? updatedStage : stage));
    updateForm({
      stages: nextStages,
      ...(activeStageIndex === 0 ? legacyPersonaPatch(updatedStage) : {}),
    });
  }

  function randomOption(options) {
    const choices = options.filter((option) => option !== "Other");
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function generatePersona() {
    updateStage({
      personaStyle: randomOption(PERSONA_STYLE_OPTIONS),
      personaEmotionalState: randomOption(PERSONA_EMOTIONAL_STATE_OPTIONS),
      personaTrustLevel: randomOption(PERSONA_TRUST_LEVEL_OPTIONS),
      personaCommunicationStyle: randomOption(PERSONA_COMMUNICATION_STYLE_OPTIONS),
      personaPrimaryConcern: randomOption(PERSONA_PRIMARY_CONCERN_OPTIONS),
    });
  }

  function stageUsingRole(role, currentIndex) {
    return stages.findIndex((stage, index) => index !== currentIndex && role !== "Other" && stage.chatbotRole === role);
  }

  function addStage() {
    if (stages.length >= 3) return;
    const nextCount = stages.length + 1;
    updateForm({ stageCount: nextCount, stages: ensureScenarioStages(form, nextCount).slice(0, nextCount) });
    setActiveStageIndex(nextCount - 1);
  }

  function removeStage(index) {
    if (stages.length <= 1 || index === 0) return;
    const nextStages = stages
      .filter((_, stageIndex) => stageIndex !== index)
      .map((stage, stageIndex) => ({ ...stage, id: `stage-${stageIndex + 1}`, name: `Stage ${stageIndex + 1}` }));
    updateForm({ stageCount: nextStages.length, stages: nextStages });
    setActiveStageIndex(Math.max(0, Math.min(activeStageIndex, nextStages.length - 1)));
  }

  function updateStageAt(index, patch) {
    const allStages = ensureScenarioStages(form, stages.length);
    const nextStages = allStages.map((item, stageIndex) => stageIndex === index ? { ...item, ...patch } : item);
    updateForm({ stages: nextStages });
  }

  return (
    <div className="wizardStepBody">
      <StageTabs
        stages={stages}
        activeStageIndex={activeStageIndex}
        onSelectStage={setActiveStageIndex}
        label="Scenario characters"
        idPrefix="stage-persona-tab"
        panelIdPrefix="stage-persona-panel"
      />

      <div className="studioGroup scenarioSetupSection characterStepCallSetup">
        <div className="stageSetupHeader">
          <span className="studioLabel">Characters &amp; Call Order <InfoNote>{FIELD_INFO.scenarioParticipants}</InfoNote></span>
          {stages.length < 3 && <button className="secondaryButton compactActionButton" type="button" onClick={addStage}><Plus size={15} /><span>Add Character</span></button>}
        </div>
        <div className="scenarioParticipantGrid">
          {stages.map((stage, index) => (
            <div className={`scenarioParticipantCard ${index === activeStageIndex ? "active" : ""}`} key={stage.id}>
              <div className="scenarioParticipantCardHeader">
                <button type="button" onClick={() => setActiveStageIndex(index)}><strong>Call {index + 1}</strong></button>
                {index === 0 && <small>Required complainant</small>}
                {index > 0 && <button className="removeStageButton" type="button" onClick={() => removeStage(index)} aria-label={`Remove character ${index + 1}`}><Trash2 size={15} /></button>}
              </div>
              <label className="studioField compactField">
                <span>Role*</span>
                <SelectControl value={stage.chatbotRole} disabled={index === 0} onChange={(event) => updateStageAt(index, { chatbotRole: event.target.value })}>
                  <option value="" disabled>Select a role</option>
                  {CHATBOT_ROLES.map((role) => {
                    const selectedStage = stageUsingRole(role, index);
                    return <option key={role} value={role} disabled={selectedStage >= 0}>{role}{selectedStage >= 0 ? ` — Call ${selectedStage + 1}` : ""}</option>;
                  })}
                </SelectControl>
              </label>
              {stage.chatbotRole === "Other" && <input value={stage.chatbotRoleOther} onChange={(event) => updateStageAt(index, { chatbotRoleOther: event.target.value })} placeholder="Custom role" />}
            </div>
          ))}
        </div>
      </div>

      <div className="personaStepHeading">
        <div><h2>Character Personas</h2><p className="wizardStepIntro">Choose the role and persona traits for the selected character call.</p></div>
        <div className="personaGenerateActions">
          <button className="secondaryButton compactActionButton" type="button" onClick={generatePersona}><Dices size={15} /><span>Randomize</span></button>
        </div>
      </div>

      <div
        className="studioGroup personaConfig stagePersonaBuilder"
        role="tabpanel"
        id={`stage-persona-panel-${activeStageIndex + 1}`}
        aria-labelledby={`stage-persona-tab-${activeStageIndex + 1}`}
      >
        <div className="stagePersonaBuilderHeader">
          <div>
            <span>Character {activeStageIndex + 1}</span>
            <h3>Role &amp; Persona Builder</h3>
          </div>
          <strong className={stagePersonaComplete(activeStage) ? "complete" : ""}>
            {stagePersonaComplete(activeStage) ? "Complete" : "In progress"}
          </strong>
        </div>
        <div className="configuredRoleSummary">
          <span>Configured role</span>
          <strong>{activeStage.chatbotRole === "Other" ? activeStage.chatbotRoleOther : activeStage.chatbotRole}</strong>
          <small>Character roles are configured in Scenario Builder.</small>
        </div>
        <div className="personaControlGrid">
          <PersonaSelect
            label="Persona Style"
            value={activeStage.personaStyle}
            options={PERSONA_STYLE_OPTIONS}
            otherValue={activeStage.personaStyleOther}
            onChange={(value) => updateStage({ personaStyle: value })}
            onOtherChange={(value) => updateStage({ personaStyleOther: value })}
            placeholder="Custom persona style"
            info={FIELD_INFO.personaStyle}
          />
          <PersonaSelect
            label="Emotional Start"
            value={activeStage.personaEmotionalState}
            options={PERSONA_EMOTIONAL_STATE_OPTIONS}
            otherValue={activeStage.personaEmotionalStateOther}
            onChange={(value) => updateStage({ personaEmotionalState: value })}
            onOtherChange={(value) => updateStage({ personaEmotionalStateOther: value })}
            placeholder="Custom emotional state"
            info={FIELD_INFO.personaEmotionalState}
          />
          <PersonaSelect
            label="Trust Level"
            value={activeStage.personaTrustLevel}
            options={PERSONA_TRUST_LEVEL_OPTIONS}
            otherValue={activeStage.personaTrustLevelOther}
            onChange={(value) => updateStage({ personaTrustLevel: value })}
            onOtherChange={(value) => updateStage({ personaTrustLevelOther: value })}
            placeholder="Custom trust level"
            info={FIELD_INFO.personaTrustLevel}
          />
          <PersonaSelect
            label="Communication"
            value={activeStage.personaCommunicationStyle}
            options={PERSONA_COMMUNICATION_STYLE_OPTIONS}
            otherValue={activeStage.personaCommunicationStyleOther}
            onChange={(value) => updateStage({ personaCommunicationStyle: value })}
            onOtherChange={(value) => updateStage({ personaCommunicationStyleOther: value })}
            placeholder="Custom communication style"
            info={FIELD_INFO.personaCommunicationStyle}
          />
          <PersonaSelect
            label="Preferred Outcome"
            value={activeStage.personaPrimaryConcern}
            options={PERSONA_PRIMARY_CONCERN_OPTIONS}
            otherValue={activeStage.personaPrimaryConcernOther}
            onChange={(value) => updateStage({ personaPrimaryConcern: value })}
            onOtherChange={(value) => updateStage({ personaPrimaryConcernOther: value })}
            placeholder="Custom primary concern"
            info={FIELD_INFO.personaPrimaryConcern}
          />
        </div>
        <label className="studioField">
          <span className="studioLabel">Chatbot Behavior Notes <em>(optional)</em></span>
          <textarea value={activeStage.chatbotBehaviorNotes} onChange={(event) => updateStage({ chatbotBehaviorNotes: event.target.value })} placeholder={`Optional behavior notes for how this character should speak or react in Call ${activeStageIndex + 1}`} />
          <InfoNote>{FIELD_INFO.chatbotBehaviorNotes}</InfoNote>
        </label>
      </div>
    </div>
  );
}
