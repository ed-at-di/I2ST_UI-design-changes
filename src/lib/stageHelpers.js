import { formValue } from "./scenarioHelpers.js";

export const PERSONA_STAGE_FIELDS = [
  "chatbotRole",
  "chatbotRoleOther",
  "chatbotBehaviorNotes",
  "personaStyle",
  "personaStyleOther",
  "personaEmotionalState",
  "personaEmotionalStateOther",
  "personaTrustLevel",
  "personaTrustLevelOther",
  "personaCommunicationStyle",
  "personaCommunicationStyleOther",
  "personaPrimaryConcern",
  "personaPrimaryConcernOther",
  "personaNotes",
];

export function stageCountFromForm(form) {
  return Math.min(3, Math.max(1, Number(form.stageCount) || 1));
}

export function emptyScenarioStage(index) {
  return {
    id: `stage-${index + 1}`,
    name: `Stage ${index + 1}`,
    chatbotRole: "",
    chatbotRoleOther: "",
    chatbotBehaviorNotes: "",
    personaStyle: "",
    personaStyleOther: "",
    personaEmotionalState: "",
    personaEmotionalStateOther: "",
    personaTrustLevel: "",
    personaTrustLevelOther: "",
    personaCommunicationStyle: "",
    personaCommunicationStyleOther: "",
    personaPrimaryConcern: "",
    personaPrimaryConcernOther: "",
    personaNotes: "",
  };
}

function legacyStage(form) {
  return PERSONA_STAGE_FIELDS.reduce(
    (stage, key) => ({ ...stage, [key]: form[key] || "" }),
    emptyScenarioStage(0)
  );
}

export function ensureScenarioStages(form, minimumCount = stageCountFromForm(form)) {
  const existing = Array.isArray(form.stages) ? form.stages : [];
  const targetLength = Math.max(existing.length, minimumCount, 1);

  return Array.from({ length: targetLength }, (_, index) => ({
    ...(index === 0 ? legacyStage(form) : emptyScenarioStage(index)),
    ...(existing[index] || {}),
    id: existing[index]?.id || `stage-${index + 1}`,
    name: existing[index]?.name || `Stage ${index + 1}`,
  }));
}

export function activeScenarioStages(form) {
  return ensureScenarioStages(form).slice(0, stageCountFromForm(form));
}

// Additional names are stable design examples until characters have their own records.
export function namedScenarioStages(form, scenario) {
  const used = new Set();
  const exampleNames = ["Alex Morgan", "Taylor Brooks", "Casey Rivera", "Jamie Chen"];
  return activeScenarioStages(form).map((stage, index) => {
    const supplied = stage.characterName || scenario?.characters?.[index]?.avatar_name || (index === 0 ? scenario?.avatar_name : "");
    const characterName = supplied || exampleNames.find((name) => !used.has(name));
    used.add(characterName);
    return { ...stage, characterName };
  });
}

export function personaValuesForStage(stage) {
  return [
    formValue(stage, "personaStyle", "personaStyleOther"),
    formValue(stage, "personaEmotionalState", "personaEmotionalStateOther"),
    formValue(stage, "personaTrustLevel", "personaTrustLevelOther"),
    formValue(stage, "personaCommunicationStyle", "personaCommunicationStyleOther"),
    formValue(stage, "personaPrimaryConcern", "personaPrimaryConcernOther"),
  ].filter(Boolean);
}

export function stagePersonaComplete(stage) {
  const requiredTraits = [
    formValue(stage, "personaEmotionalState", "personaEmotionalStateOther"),
    formValue(stage, "personaTrustLevel", "personaTrustLevelOther"),
    formValue(stage, "personaCommunicationStyle", "personaCommunicationStyleOther"),
    formValue(stage, "personaPrimaryConcern", "personaPrimaryConcernOther"),
  ];
  return Boolean(formValue(stage, "chatbotRole", "chatbotRoleOther")) && requiredTraits.every(Boolean);
}

export function legacyPersonaPatch(stage) {
  return PERSONA_STAGE_FIELDS.reduce((patch, key) => ({ ...patch, [key]: stage[key] || "" }), {});
}
