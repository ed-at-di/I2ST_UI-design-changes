import { COMPETENCY_OPTIONS } from "../data/scenarioOptions.js";

export function formatLatency(ms) {
  if (ms === null || ms === undefined) return "";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift()?.map((item) => item.trim()) || [];
  return rows
    .filter((items) => items.some((item) => item.trim()))
    .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] || ""])));
}

export async function loadLocalCurriculumRows() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/curriculum_scenarios.csv`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return parseCsv(await response.text());
  } catch {
    return [];
  }
}

export function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function slug(value, fallback = "scenario") {
  const out = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || fallback;
}

export function timestampForFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function exportScenarioFilename(scenario) {
  const titleSlug = slug(scenario.title).slice(0, 72).replace(/-+$/g, "") || "scenario";
  return `i2st-scenario-record-${titleSlug}-${timestampForFilename()}.xlsx`;
}

export function arrayToggle(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function selectedCompetencies(form) {
  return Array.isArray(form.competencyFocuses) ? form.competencyFocuses : form.competencyFocus ? [form.competencyFocus] : [];
}

export function competencyDetails(titles) {
  const out = [];
  titles.forEach((title) => {
    const option = COMPETENCY_OPTIONS.find((item) => item.title === title);
    (option?.details || []).forEach((detail) => {
      if (!out.includes(detail)) out.push(detail);
    });
  });
  return out;
}

export function sourceReference(source) {
  if (!source) return "";
  return ["SJT curriculum PDF", source.curriculum_scenario_id, source.source_page ? `page ${source.source_page}` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function sourceLabel(source, rows) {
  if (!source) return "";
  const category = clean(source.category || "Source scenario");
  const subcategory = clean(source.subcategory || category);
  const sameType = rows.filter((item) => clean(item.category) === clean(source.category) && clean(item.subcategory) === clean(source.subcategory));
  const index = sameType.findIndex((item) => item.curriculum_scenario_id === source.curriculum_scenario_id);
  const scenarioNumber = index >= 0 ? index + 1 : source.item_number || "";
  return `${category} - ${subcategory} - Scenario ${scenarioNumber}`.trim();
}

export function firstSource(catalog, form) {
  const rows = catalog.curriculumScenarios || [];
  return rows.find((item) => item.curriculum_scenario_id === form.curriculumScenarioId) || rows[0] || null;
}

export function formValue(form, key, otherKey) {
  const value = clean(form[key]);
  if (value === "Other" && otherKey) return clean(form[otherKey]);
  return value;
}

export function selectedList(values, otherValue) {
  return values.map((item) => (item === "Other" && otherValue ? otherValue : item)).filter(Boolean);
}

export function previewFromFormOrScenario(scenario, form, source) {
  if (!scenario) {
    return {
      chatbotRole: "",
      competencyFocus: "",
      performanceObjective: "",
      scenarioFactors: "",
      scenarioComplexities: "",
      sourceScenario: "",
      avatarName: "",
      personaDetails: "",
      otherDetails: "",
      evaluationSummary: "",
      scenarioTitle: "",
      scenarioSummary: "",
      inContextPersonaSummary: "",
    };
  }
  // A catalog stub only carries role/title/persona label (see
  // scenarioFromCatalogItem) — the wizard form state at this point is just
  // whatever DEFAULT_FORM last held, so form-derived fields (competency,
  // factors, complexities, other details) would be misleading if shown.
  if (scenario.isCatalogStub) {
    const persona = scenario.persona || {};
    const personaDetails = [
      persona.style ? `Style: ${persona.style}` : "",
      persona.emotional_state ? `Emotional start: ${persona.emotional_state}` : "",
      persona.trust_level ? `Trust level: ${persona.trust_level}` : "",
      persona.communication_style ? `Communication: ${persona.communication_style}` : "",
      persona.primary_concern ? `Primary concern: ${persona.primary_concern}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      chatbotRole: scenario.role || "",
      competencyFocus: "",
      performanceObjective: "",
      scenarioFactors: "",
      scenarioComplexities: "",
      sourceScenario: "",
      avatarName: scenario.avatar_name || "Avatar",
      personaDetails,
      otherDetails: "",
      evaluationSummary: "",
      scenarioTitle: scenario.title || "",
      scenarioSummary: "",
      inContextPersonaSummary: [scenario.role, persona.style, persona.emotional_state, persona.trust_level, persona.communication_style, persona.primary_concern]
        .filter(Boolean)
        .join(" / "),
    };
  }
  const competencies = selectedCompetencies(form);
  const factorList = selectedList(form.scenarioFactors, form.otherFactor);
  const complexityList = selectedList(form.scenarioComplexities, form.otherComplexity);
  const authoring = scenario?.authoring || {};
  const persona = scenario?.persona || {};
  const sourceMode = authoring.payload?.sourceScenarioMode || form.sourceScenarioMode;
  const authoredSource = sourceMode === "manual" ? authoring.sourceContext?.scenario : null;
  const previewSource = authoredSource && Object.keys(authoredSource).length ? authoredSource : null;
  const sourceText = previewSource ? [sourceLabel(previewSource, []), clean(previewSource.scenario_text), authoring.sourceContext?.reference || sourceReference(previewSource)].filter(Boolean).join("\n") : "";
  const personaDetails = [
    `Style: ${persona.style || formValue(form, "personaStyle", "personaStyleOther")}`,
    `Emotional start: ${persona.emotional_state || formValue(form, "personaEmotionalState", "personaEmotionalStateOther")}`,
    `Trust level: ${persona.trust_level || formValue(form, "personaTrustLevel", "personaTrustLevelOther")}`,
    `Communication: ${persona.communication_style || formValue(form, "personaCommunicationStyle", "personaCommunicationStyleOther")}`,
    `Primary concern: ${persona.primary_concern || formValue(form, "personaPrimaryConcern", "personaPrimaryConcernOther")}`,
    persona.notes || form.personaNotes ? `Persona notes: ${persona.notes || form.personaNotes}` : "",
    persona.behavior_notes || form.chatbotBehaviorNotes ? `Behavior notes: ${persona.behavior_notes || form.chatbotBehaviorNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const inContextPersonaSummary =
    authoring.inContextPersonaSummary ||
    [
      scenario.role,
      persona.style || formValue(form, "personaStyle", "personaStyleOther"),
      persona.emotional_state || formValue(form, "personaEmotionalState", "personaEmotionalStateOther"),
      persona.trust_level || formValue(form, "personaTrustLevel", "personaTrustLevelOther"),
      persona.communication_style || formValue(form, "personaCommunicationStyle", "personaCommunicationStyleOther"),
      persona.primary_concern || formValue(form, "personaPrimaryConcern", "personaPrimaryConcernOther"),
    ]
      .filter(Boolean)
      .join(" / ");

  return {
    chatbotRole: scenario.role || formValue(form, "chatbotRole", "chatbotRoleOther"),
    competencyFocus: `${competencies.join(", ") || "None"}\n(${competencyDetails(competencies).join(", ") || "No details"})`,
    performanceObjective: form.performanceObjective || "None",
    scenarioFactors: factorList.join(", ") || "None",
    scenarioComplexities: complexityList.join(", ") || "None",
    sourceScenario: sourceText,
    avatarName: scenario.avatar_name || "Avatar",
    personaDetails,
    otherDetails: form.otherDetails || "None",
    evaluationSummary: `${form.successCriteria.filter((criterion) => clean(criterion.description) && clean(criterion.kpa)).length} success criteria · ${form.decisionPoints.filter((point) => clean(point.cue) && clean(point.learnerBehavior) && clean(point.consequence)).length} decision points · ${form.debriefQuestions.filter((value) => clean(value)).length} debrief questions`,
    scenarioTitle: scenario.title || `${formValue(form, "chatbotRole", "chatbotRoleOther")}: Workplace Concern`,
    scenarioSummary:
      scenario.summary ||
      [
        clean(source?.scenario_text),
        form.scenarioSetting ? `Setting: ${clean(form.scenarioSetting)}.` : "",
        form.scenarioBackground ? `Background: ${clean(form.scenarioBackground)}.` : "",
        form.scenarioTrigger ? `Trigger: ${clean(form.scenarioTrigger)}.` : "",
        form.scenarioChallenge ? `Challenge: ${clean(form.scenarioChallenge)}.` : "",
        `Role: ${formValue(form, "chatbotRole", "chatbotRoleOther")}.`,
        `Training focus: ${competencies.join(", ") || "workplace conversation"}.`,
        `Factors: ${factorList.join(", ") || "not specified"}.`,
        `Complexities: ${complexityList.join(", ") || "none selected"}.`,
        form.otherDetails,
      ]
        .filter(Boolean)
        .join(" "),
    inContextPersonaSummary,
  };
}

// The Home screen's "old scenarios" list only carries a single joined label
// string ("Style / Emotional / Trust / Comm / Concern") from /chatbot/scenarios,
// not the full authoring packet. This reconstructs enough of a persona object
// to populate the Review step's persona fields for a previously-built scenario.
export function personaFromLabel(label) {
  const parts = String(label || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const [style = "", emotional_state = "", trust_level = "", communication_style = "", primary_concern = ""] = parts;
  return { style, emotional_state, trust_level, communication_style, primary_concern };
}

export function scenarioFromCatalogItem(item) {
  return {
    scenario_id: item.scenario_id,
    title: item.title,
    role: item.role,
    avatar_name: "Avatar",
    summary: "",
    persona: personaFromLabel(item.persona),
    authoring: {},
    // Marks this as a thin, catalog-derived stub (title/role/persona label
    // only) rather than a freshly-authored packet — see startSession() in
    // main.jsx, which needs to tell the two apart when starting a chat.
    isCatalogStub: true,
  };
}

export function writeScenarioWorkbook(XLSX, scenario) {
  const authoring = scenario.authoring || {};
  const payload = authoring.payload || {};
  const sourceContext = authoring.sourceContext || {};
  const isSourceLibraryScenario = (payload.sourceScenarioMode || "") === "manual" || authoring.generatedBy === "source-library";
  const sourceScenario = isSourceLibraryScenario ? sourceContext.scenario || {} : {};
  const persona = scenario.persona || {};
  const focusTitles = selectedList(payload.competencyFocuses || [], "");
  const primaryFocus = focusTitles[0] || clean(payload.competencyFocus).split(",")[0] || "None";
  const factorText = selectedList(payload.scenarioFactors || [], payload.otherFactor).join(", ") || "None";
  const complexityText = selectedList(payload.scenarioComplexities || [], payload.otherComplexity).join(", ") || "None";
  const personaDetails = [
    persona.style ? `Style: ${persona.style}` : "",
    persona.emotional_state ? `Emotional start: ${persona.emotional_state}` : "",
    persona.trust_level ? `Trust level: ${persona.trust_level}` : "",
    persona.communication_style ? `Communication: ${persona.communication_style}` : "",
    persona.primary_concern ? `Primary concern: ${persona.primary_concern}` : "",
    persona.notes ? `Persona notes: ${persona.notes}` : "",
    persona.behavior_notes ? `Behavior notes: ${persona.behavior_notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const sourceText =
    isSourceLibraryScenario && (clean(sourceScenario.scenario_text) || clean(sourceScenario.curriculum_scenario_id))
      ? [
          sourceLabel(sourceScenario, []),
          clean(sourceScenario.scenario_text),
          sourceContext.reference || sourceReference(sourceScenario),
        ]
          .filter(Boolean)
          .join("\n")
      : "";
  const inContextPersonaSummary =
    authoring.inContextPersonaSummary ||
    [
      scenario.role,
      persona.style,
      persona.emotional_state,
      persona.trust_level,
      persona.communication_style,
      persona.primary_concern,
    ]
      .filter(Boolean)
      .join(" / ");
  const rows = [
    { kind: "title", cells: ["Scenario Record", ""] },
    { group: "scenario", cells: ["Chatbot Role", scenario.role || ""] },
    { group: "scenario", cells: ["Key Performance Areas Focus", primaryFocus] },
    { group: "scenario", cells: ["Performance Objective", payload.performanceObjective || "None"] },
    { group: "scenario", cells: ["Scenario Factors", factorText] },
    { group: "scenario", cells: ["Scenario Complexities", complexityText] },
    { group: "scenario", cells: ["Setting", payload.scenarioSetting || "None"] },
    { group: "scenario", cells: ["Background", payload.scenarioBackground || "None"] },
    { group: "scenario", cells: ["Trigger", payload.scenarioTrigger || "None"] },
    { group: "scenario", cells: ["Challenge", payload.scenarioChallenge || "None"] },
    ...(isSourceLibraryScenario ? [{ group: "scenario", cells: ["Source Curriculum Scenario", sourceText] }] : []),
    { group: "scenario", cells: ["Other Details", payload.otherDetails || "None"] },
    {
      group: "evaluation",
      cells: [
        "Decision & Evidence Map",
        (payload.decisionPoints || []).map((point, index) => `${index + 1}. Cue: ${clean(point.cue)}\nLearner behavior: ${clean(point.learnerBehavior)}\nConsequence/evidence: ${clean(point.consequence)}`).join("\n\n") || "None",
      ],
    },
    { group: "evaluation", cells: ["Success Criteria", (payload.successCriteria || []).filter((criterion) => clean(criterion.description)).map((criterion, index) => `${index + 1}. ${clean(criterion.description)}\nKPA: ${clean(criterion.kpa) || "Not assigned"}`).join("\n\n") || "None"] },
    { group: "evaluation", cells: ["Evidence to Capture", selectedList(payload.evidenceMethods || [], payload.evidenceOther).join("\n") || "None"] },
    { group: "evaluation", cells: ["Critical Errors or Omissions", (payload.criticalErrors || []).map(clean).filter(Boolean).map((value, index) => `${index + 1}. ${value}`).join("\n") || "None"] },
    { group: "evaluation", cells: ["Debrief Questions", (payload.debriefQuestions || []).map(clean).filter(Boolean).map((value, index) => `${index + 1}. ${value}`).join("\n") || "None"] },
    { group: "persona", cells: ["Chatbot Character", scenario.avatar_name || ""] },
    { group: "persona", cells: ["Persona Inputs", personaDetails] },
    { group: "summary", kind: "boxed", cells: ["Scenario Title", scenario.title || ""] },
    { group: "summary", cells: ["Scenario Summary", scenario.summary || ""] },
    { group: "summary", cells: ["In-Context Persona Summary", inContextPersonaSummary] },
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows.map((row) => row.cells));
  worksheet["!cols"] = [{ wch: 30 }, { wch: 105 }];
  worksheet["!merges"] = rows
    .map((row, index) => (row.kind === "title" ? { s: { r: index, c: 0 }, e: { r: index, c: 1 } } : null))
    .filter(Boolean);
  rows.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < 2; colIndex += 1) {
      const ref = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (!worksheet[ref]) worksheet[ref] = { t: "s", v: "" };
      const groupColors = {
        scenario: { label: "EAF7FB", value: "F6FCFE" },
        persona: { label: "FCEAEA", value: "FFF7F7" },
        evaluation: { label: "FFF0D2", value: "FFFAF0" },
        summary: { label: "EAF7EC", value: "F7FFF8" },
      };
      const colors = groupColors[row.group] || groupColors.scenario;
      const baseStyle = {
        alignment: { vertical: "top", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "D9E1E5" } },
          bottom: { style: "thin", color: { rgb: "D9E1E5" } },
          left: { style: "thin", color: { rgb: "D9E1E5" } },
          right: { style: "thin", color: { rgb: "D9E1E5" } },
        },
      };
      if (row.kind === "title") {
        worksheet[ref].s = {
          ...baseStyle,
          fill: { fgColor: { rgb: "078DA2" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 16 },
        };
      } else if (row.kind === "boxed") {
        worksheet[ref].s = {
          ...baseStyle,
          fill: { fgColor: { rgb: colIndex === 0 ? colors.label : colors.value } },
          font: { color: { rgb: "374451" }, bold: true },
        };
      } else {
        worksheet[ref].s = {
          ...baseStyle,
          fill: { fgColor: { rgb: colIndex === 0 ? colors.label : colors.value } },
          font: { color: { rgb: "374451" }, bold: colIndex === 0 },
        };
      }
    }
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Scenario Record");
  XLSX.writeFile(workbook, exportScenarioFilename(scenario));
}
