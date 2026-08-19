import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { scenarioAuthoringInstructions } from "./prompts/scenarioAuthoringPrompt.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const SERVER_DATA_DIR = path.join(ROOT, "server", "data");
const RECENT_AVATAR_NAMES = [];
const RECENT_AVATAR_NAME_LIMIT = 250;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slug(value, fallback = "scenario") {
  const out = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (out || fallback).slice(0, 80);
}

function parseCsv(text) {
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

function readCsv(name) {
  const filePath = path.join(DATA_DIR, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function readServerCsv(name) {
  const filePath = path.join(SERVER_DATA_DIR, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

let firstNameRowsCache = null;
let lastNameRowsCache = null;
let firstNameClassificationsCache = null;

function firstNameRows() {
  if (!firstNameRowsCache) firstNameRowsCache = readServerCsv("avatar_first_names.csv");
  return firstNameRowsCache;
}

function lastNameRows() {
  if (!lastNameRowsCache) lastNameRowsCache = readServerCsv("avatar_last_names.csv");
  return lastNameRowsCache;
}

function firstNameClassifications() {
  if (!firstNameClassificationsCache) {
    firstNameClassificationsCache = Object.fromEntries(firstNameRows().filter((row) => row.name).map((row) => [row.name.toLowerCase(), row.classification || "unknown"]));
  }
  return firstNameClassificationsCache;
}

function cleanName(value) {
  return String(value || "")
    .trim()
    .replace(/[."`]/g, " ")
    .replace(/\s+/g, " ");
}

function validAvatarName(value) {
  const text = cleanName(value).trim();
  if (!text || text.length > 40) return "";
  if (["taylor morgan", "generated avatar", "roleplay participant", "jordan hayes"].includes(text.toLowerCase())) return "";
  if (/\d/.test(text)) return "";
  const parts = text.split(" ");
  if (parts.length !== 2) return "";
  if (!parts.every((part) => part.replace(/[-']/g, "").match(/^[A-Za-z]{2,}$/))) return "";
  return text;
}

function classifyFirstNameGender(value) {
  const first = cleanName(value).split(" ")[0]?.toLowerCase() || "";
  return firstNameClassifications()[first] || "unknown";
}

function firstPool(expectedGender) {
  const rows = firstNameRows();
  let pool = [];
  if (["male", "female"].includes(expectedGender)) {
    pool = rows.filter((row) => row.classification === expectedGender);
  } else if (expectedGender === "neutral") {
    pool = rows.filter((row) => row.classification === "neutral");
  } else {
    pool = rows.filter((row) => row.classification === "neutral");
  }
  return pool.length ? pool : rows;
}

function rememberAvatarName(name) {
  if (!name) return;
  RECENT_AVATAR_NAMES.push(name);
  RECENT_AVATAR_NAMES.splice(0, Math.max(0, RECENT_AVATAR_NAMES.length - RECENT_AVATAR_NAME_LIMIT));
}

function pickAvatarName(expectedGender, avoidNames = []) {
  const started = Date.now();
  const normalizedGender = ["male", "female", "neutral"].includes(expectedGender) ? expectedGender : "unknown";
  const firstNames = firstPool(normalizedGender);
  const lastNames = lastNameRows();
  if (!firstNames.length || !lastNames.length) {
    return {
      name: "Avatar",
      meta: {
        provider: "local",
        task: "avatar-name-picker",
        skippedLlm: true,
        ms: Date.now() - started,
        validationFailed: true,
        pool: { firstNames: firstNames.length, lastNames: lastNames.length, expectedGender: normalizedGender },
      },
    };
  }
  const avoid = new Set([...avoidNames, ...RECENT_AVATAR_NAMES].map(validAvatarName).filter(Boolean));
  let bestName = "";
  let bestClassification = "unknown";
  const attempts = [];
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const first = firstNames[crypto.randomInt(firstNames.length)]?.name || "";
    const last = lastNames.length ? lastNames[crypto.randomInt(lastNames.length)]?.name || "" : "";
    const name = validAvatarName(`${first} ${last}`);
    const classified = classifyFirstNameGender(name);
    const aligned = !["male", "female"].includes(normalizedGender) || classified === normalizedGender;
    const duplicateName = avoid.has(name);
    const valid = Boolean(name && aligned && !duplicateName);
    if (attempt < 8 || valid) {
      attempts.push({ attempt: attempt + 1, name, classifiedGender: classified, expectedGender: normalizedGender, duplicateName, valid });
    }
    if (name && aligned && !bestName) {
      bestName = name;
      bestClassification = classified;
    }
    if (valid) {
      rememberAvatarName(name);
      return {
        name,
        meta: {
          provider: "local",
          task: "avatar-name-picker",
          skippedLlm: true,
          ms: Date.now() - started,
          attempts,
          validatedGender: classified,
          pool: { firstNames: firstNames.length, lastNames: lastNames.length, expectedGender: normalizedGender },
        },
      };
    }
  }
  if (bestName) {
    rememberAvatarName(bestName);
    return {
      name: bestName,
      meta: {
        provider: "local",
        task: "avatar-name-picker",
        skippedLlm: true,
        ms: Date.now() - started,
        attempts,
        validatedGender: bestClassification,
        duplicateAcceptedAfterRetries: true,
        pool: { firstNames: firstNames.length, lastNames: lastNames.length, expectedGender: normalizedGender },
      },
    };
  }
  return {
    name: "Avatar",
    meta: {
      provider: "local",
      task: "avatar-name-picker",
      skippedLlm: true,
      ms: Date.now() - started,
      validationFailed: true,
      attempts,
      pool: { firstNames: firstNames.length, lastNames: lastNames.length, expectedGender: normalizedGender },
    },
  };
}

function parseEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function env() {
  const local = parseEnvFile(path.join(ROOT, ".env.local"));
  const project = parseEnvFile(path.join(ROOT, ".env"));
  const external = parseEnvFile(process.env.L2ST_FINAL_ENV_FILE || process.env.I2ST_UI_ENV_FILE || "");
  return { ...local, ...project, ...external, ...process.env };
}

function values(items, other = "") {
  const selected = Array.isArray(items) ? items : String(items || "").split("|");
  return selected
    .map((item) => (item === "Other" && other ? other : item))
    .map(clean)
    .filter(Boolean);
}

function controlValue(payload, key, otherKey) {
  const selected = clean(payload[key]);
  const other = clean(payload[otherKey]);
  return selected === "Other" && other ? other : selected;
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function roleKind(payload) {
  const role = controlValue(payload, "chatbotRole", "chatbotRoleOther").toLowerCase();
  if (role.includes("person complaint") || role.includes("respondent") || role.includes("subject")) return "respondent";
  if (role.includes("witness")) return "witness";
  if (role.includes("complainant")) return "complainant";
  return "participant";
}

function inferExpectedAvatarGender(payload, sourceRow = null, generated = null) {
  const role = roleKind(payload);
  const selectedFactors = values(payload.scenarioFactors, payload.otherFactor).join(" ").toLowerCase();
  const generatedText = [
    generated?.title,
    generated?.summary,
    generated?.opening_line,
    ...(Array.isArray(generated?.public_facts) ? generated.public_facts : []),
    payload.otherDetails,
    payload.scenarioSetting,
    payload.scenarioBackground,
    payload.scenarioTrigger,
    payload.scenarioChallenge,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();
  const sourceText = [sourceRow?.scenario_text, sourceRow?.category, sourceRow?.subcategory].map(clean).join(" ").toLowerCase();
  const allText = `${generatedText} ${sourceText}`;

  if (hasPattern(generatedText, [/\bmy pregnancy\b/, /\bi(?:'m| am) pregnant\b/, /\bi(?:'m| am) due\b/, /\bdue in \w+ months\b/])) {
    return { gender: "female", reason: "generated_avatar_self_pregnancy" };
  }
  if (role === "complainant" && (selectedFactors.includes("pregnancy") || selectedFactors.includes("parental")) && /\bpregnan|pregnant|parental leave|due in\b/.test(allText)) {
    return { gender: "female", reason: "complainant_pregnancy_or_parental_case" };
  }
  if (
    hasPattern(generatedText, [
      /\b(?:female|woman)\s+(?:employee|service member|officer|member|complainant|reporting party|e\d)\b/,
      /\b(?:she|her)\s+(?:reported|reports|tells|says|claims|is upset|is worried|seeks|needs)\b/,
    ])
  ) {
    return { gender: "female", reason: "generated_avatar_described_as_female" };
  }
  if (
    hasPattern(generatedText, [
      /\b(?:male|man)\s+(?:employee|service member|officer|member|complainant|reporting party|e\d)\b/,
      /\b(?:he|him)\s+(?:reported|reports|tells|says|claims|is upset|is worried|seeks|needs)\b/,
    ])
  ) {
    return { gender: "male", reason: "generated_avatar_described_as_male" };
  }

  if (role === "complainant" || role === "witness") {
    if (hasPattern(sourceText, [/\b(?:a|the|one)\s+(?:black\s+|white\s+)?female\b.{0,120}\b(?:tells|comes|asks|reports|claims|shares|approaches|is upset|is still|has been|seeks)/])) {
      return { gender: "female", reason: `source_${role}_described_as_female` };
    }
    if (hasPattern(sourceText, [/\b(?:a|the|one)\s+male\b.{0,120}\b(?:tells|comes|asks|reports|claims|shares|approaches|is upset|is still|has been|seeks)/])) {
      return { gender: "male", reason: `source_${role}_described_as_male` };
    }
  }

  if (role === "respondent") {
    if (hasPattern(sourceText, [/\byou speak with the female\b/, /\bfemale\b.{0,120}\b(?:admits|responded|called|touched|pursu(?:ed|ing)|has been calling|is accused|reportedly called)/])) {
      return { gender: "female", reason: "source_respondent_described_as_female" };
    }
    if (hasPattern(sourceText, [/\byou speak with the male\b/, /\bmale\b.{0,120}\b(?:admits|responded|called|touched|pursu(?:ed|ing)|has been calling|is accused|reportedly called)/])) {
      return { gender: "male", reason: "source_respondent_described_as_male" };
    }
  }

  return { gender: "neutral", reason: "no_clear_gender_signal" };
}

function assignAvatarName(payload, sourceRow = null, generated = null) {
  const inference = inferExpectedAvatarGender(payload, sourceRow, generated);
  const generatedName = generated?.avatar_name || "";
  const picked = pickAvatarName(inference.gender, [generatedName]);
  return {
    name: picked.name,
    meta: {
      ...picked.meta,
      expectedGenderReason: inference.reason,
      llmSuggestedName: clean(generatedName),
    },
  };
}

function sourceReference(row) {
  if (!row) return "";
  return ["SJT curriculum PDF", row.curriculum_scenario_id, row.source_page ? `page ${row.source_page}` : ""].filter(Boolean).join(" · ");
}

function findSourceRow(payload, rows) {
  if (!rows.length) return null;
  const requested = clean(payload.curriculumScenarioId);
  if (requested) {
    const row = rows.find((item) => clean(item.curriculum_scenario_id) === requested);
    if (row) return row;
  }
  const factors = values(payload.scenarioFactors, payload.otherFactor).join(" ").toLowerCase();
  if (factors) {
    const factorTokens = factors.replace(/[/-]/g, " ").split(/\s+/).filter((item) => item.length > 2);
    const scored = rows
      .map((row, index) => {
        const haystack = `${row.category || ""} ${row.subcategory || ""} ${row.scenario_text || ""}`.toLowerCase();
        const score = factorTokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
        return { row, index, score };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index);
    if (scored[0]?.score > 0) return scored[0].row;
  }
  return rows[0];
}

function scoreGeneratedScenario(payload, row, index = 0) {
  const selectedFactors = new Set(values(payload.scenarioFactors, payload.otherFactor));
  const selectedComplexities = new Set(values(payload.scenarioComplexities, payload.otherComplexity));
  const selectedRole = controlValue(payload, "chatbotRole", "chatbotRoleOther").toLowerCase();
  const rowFactors = new Set(values(row.scenario_factors));
  const rowComplexities = new Set(values(row.complexities));
  let score = 0;
  if (selectedRole && selectedRole === clean(row.chatbot_role).toLowerCase()) score += 4;
  selectedFactors.forEach((item) => {
    if (rowFactors.has(item)) score += 5;
  });
  selectedComplexities.forEach((item) => {
    if (rowComplexities.has(item)) score += 2;
  });
  if (selectedFactors.size && [...selectedFactors].every((item) => rowFactors.has(item))) score += 6;
  if (selectedFactors.size && rowFactors.size === selectedFactors.size && [...selectedFactors].every((item) => rowFactors.has(item))) score += 10;
  rowFactors.forEach((item) => {
    if (selectedFactors.size && !selectedFactors.has(item)) score -= 3;
  });
  return { row, index, score };
}

function findGeneratedSeed(payload, rows) {
  if (!rows.length) return null;
  let best = null;
  let bestScore = -1;
  rows.forEach((row, index) => {
    const { score } = scoreGeneratedScenario(payload, row, index);
    if (score > bestScore) {
      best = { ...row, _index: index };
      bestScore = score;
    }
  });
  return bestScore > 0 ? best : null;
}

function generatedExampleSnapshot(row) {
  if (!row) return null;
  return {
    scenario_id: row.scenario_id,
    title: row.title,
    chatbot_role: row.chatbot_role,
    competency_focus: row.competency_focus,
    competency_details: values(row.competency_details),
    scenario_factors: values(row.scenario_factors),
    complexities: values(row.complexities),
    scenario_summary: row.scenario_summary,
    in_context_persona_summary: row.in_context_persona_summary,
    opening_line: row.opening_line,
    public_facts: values(row.public_facts),
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function factorLabelVisible(label, text) {
  const tokens = clean(label)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  return tokens.some((token) => new RegExp(`\\b${escapeRegex(token)}\\b`, "i").test(text));
}

function missingRequiredFactors(payload, scenario) {
  const text = [
    scenario?.summary,
    ...(Array.isArray(scenario?.public_facts) ? scenario.public_facts : []),
  ]
    .join(" ")
    .toLowerCase();
  return values(payload.scenarioFactors, payload.otherFactor).filter((label) => !factorLabelVisible(label, text));
}

function summaryHasMetaLanguage(scenario) {
  const summary = clean(scenario?.summary).toLowerCase();
  return /\b(you will roleplay|the trainee should|the trainee must|this scenario tests|this scenario is for training|expected to)\b/.test(summary);
}

function wordCount(value) {
  const text = clean(value);
  return text ? text.split(/\s+/).length : 0;
}

function summaryTooLong(scenario) {
  return wordCount(scenario?.summary) > 70;
}

function findGeneratedExamples(payload, rows, seed) {
  const seen = new Set();
  const examples = [];
  const add = (row) => {
    if (!row || seen.has(row.scenario_id)) return;
    const snapshot = generatedExampleSnapshot(row);
    if (!snapshot) return;
    seen.add(row.scenario_id);
    examples.push(snapshot);
  };
  add(seed);
  rows
    .map((row, index) => scoreGeneratedScenario(payload, row, index))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .forEach((item) => add(item.row));
  rows
    .filter((row) => values(row.complexities).includes("Maximized Emotional Intensity"))
    .slice(0, 3)
    .forEach(add);
  return examples.slice(0, 4);
}

function personaFromPayload(payload) {
  return {
    key: slug(
      [
        controlValue(payload, "personaStyle", "personaStyleOther"),
        controlValue(payload, "personaEmotionalState", "personaEmotionalStateOther"),
        controlValue(payload, "personaTrustLevel", "personaTrustLevelOther"),
        controlValue(payload, "personaCommunicationStyle", "personaCommunicationStyleOther"),
        controlValue(payload, "personaPrimaryConcern", "personaPrimaryConcernOther"),
      ].join("|"),
      "authored-persona",
    ),
    style: controlValue(payload, "personaStyle", "personaStyleOther") || "Guarded source",
    emotional_state: controlValue(payload, "personaEmotionalState", "personaEmotionalStateOther") || "Guarded",
    trust_level: controlValue(payload, "personaTrustLevel", "personaTrustLevelOther") || "Mixed trust",
    communication_style: controlValue(payload, "personaCommunicationStyle", "personaCommunicationStyleOther") || "Careful and concrete",
    primary_concern: controlValue(payload, "personaPrimaryConcern", "personaPrimaryConcernOther") || "Being taken seriously",
    notes: clean(payload.personaNotes),
    behavior_notes: clean(payload.chatbotBehaviorNotes),
    natural_speech: "Let the selected persona affect tone, guardedness, trust, and pacing without adding facts.",
    avoid: "Do not sound like a policy lecture.|Do not invent facts outside the scenario.|Do not expose scoring markers.",
  };
}

function inContextPersonaSummaryFromPayload(payload) {
  return [
    controlValue(payload, "chatbotRole", "chatbotRoleOther") || "Complainant",
    controlValue(payload, "personaStyle", "personaStyleOther") || "Guarded source",
    controlValue(payload, "personaEmotionalState", "personaEmotionalStateOther") || "Guarded",
    controlValue(payload, "personaTrustLevel", "personaTrustLevelOther") || "Mixed trust",
    controlValue(payload, "personaCommunicationStyle", "personaCommunicationStyleOther") || "Careful and concrete",
    controlValue(payload, "personaPrimaryConcern", "personaPrimaryConcernOther") || "Being taken seriously",
  ]
    .filter(Boolean)
    .join(" / ");
}

function deterministicScenario(payload, sourceRow) {
  const persona = personaFromPayload(payload);
  const role = controlValue(payload, "chatbotRole", "chatbotRoleOther") || "Complainant";
  const factors = values(payload.scenarioFactors, payload.otherFactor);
  const complexities = values(payload.scenarioComplexities, payload.otherComplexity);
  const focus = values(payload.competencyFocuses).join(", ") || clean(payload.competencyFocus) || "workplace conversation";
  const sourceText = clean(sourceRow?.scenario_text);
  const otherDetails = clean(payload.otherDetails);
  const structuredDetails = [payload.scenarioSetting, payload.scenarioBackground, payload.scenarioTrigger, payload.scenarioChallenge].map(clean).filter(Boolean);
  const title = `${role}: ${clean(sourceRow?.subcategory || sourceRow?.category || "Workplace Concern")}`;
  const assignedName = assignAvatarName(payload, sourceRow);
  return {
    scenario_id: `ui-source-${slug(sourceRow?.curriculum_scenario_id || title)}-${slug(persona.key).slice(0, 20)}`,
    title,
    avatar_name: assignedName.name,
    role,
    summary: [sourceText, ...structuredDetails, `Role: ${role}.`, `Training focus: ${focus}.`, otherDetails].filter(Boolean).join(" "),
    opening_line: "Hi, I wanted to talk about something that happened.",
    public_facts: [sourceText, ...structuredDetails, otherDetails].filter(Boolean),
    source: "i2st_ui_source_library",
    category: factors.join("|"),
    subcategory: complexities.join("|"),
    persona,
    authoring: {
      payload,
      sourceContext: { scenario: sourceRow || {}, reference: sourceReference(sourceRow) },
      inContextPersonaSummary: inContextPersonaSummaryFromPayload(payload),
      generatedBy: "source-library",
      nameGeneration: assignedName.meta,
    },
  };
}

const scenarioSchema = {
  type: "object",
  additionalProperties: false,
    properties: {
      title: { type: "string" },
      role: { type: "string" },
      summary: { type: "string" },
      opening_line: { type: "string" },
      public_facts: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
    },
  required: ["title", "role", "summary", "opening_line", "public_facts"],
};

async function callScenarioLlm(payload, generatedSeed, generatedExamples, repairContext = null) {
  const config = env();
  const model = clean(config.I2ST_UI_SCENARIO_MODEL || config.L2ST_FINAL_SCENARIO_MODEL || config.L2ST_FINAL_MODEL || config.AZURE_OPENAI_DEPLOYMENT || config.OPENAI_MODEL || "gpt-5-mini");
  const azureKey = clean(config.AZURE_OPENAI_API_KEY);
  const azureEndpoint = clean(config.AZURE_OPENAI_ENDPOINT).replace(/\/+$/, "");
  const openaiKey = clean(config.OPENAI_API_KEY);
  const apiVersion = clean(config.AZURE_OPENAI_API_VERSION) || "2025-04-01-preview";
  if (!azureKey && !openaiKey) {
    throw new Error("No OpenAI or Azure OpenAI credentials found for UI scenario generation.");
  }
  const instructions = scenarioAuthoringInstructions({ repairContext });
  const input = {
    authoring_controls: payload,
    selected_persona_summary: inContextPersonaSummaryFromPayload(payload),
    required_factor_labels: values(payload.scenarioFactors, payload.otherFactor),
    required_complexity_labels: values(payload.scenarioComplexities, payload.otherComplexity),
    matched_generated_seed: generatedExampleSnapshot(generatedSeed) || {},
    generated_scenario_examples: generatedExamples || [],
    repair_context: repairContext || undefined,
  };
  const body = {
    model,
    instructions,
    input: [{ role: "user", content: JSON.stringify(input) }],
    max_output_tokens: 900,
    text: {
      format: {
        type: "json_schema",
        name: "i2st_ui_scenario_packet",
        schema: scenarioSchema,
        strict: true,
      },
      verbosity: "low",
    },
    reasoning: { effort: "minimal" },
    store: false,
  };
  const headers = { "Content-Type": "application/json" };
  const urls = [];
  if (azureKey && azureEndpoint) {
    headers.Authorization = `Bearer ${azureKey}`;
    headers["api-key"] = azureKey;
    urls.push(`${azureEndpoint}/openai/v1/responses`);
    urls.push(`${azureEndpoint}/openai/responses?api-version=${apiVersion}`);
  } else {
    headers.Authorization = `Bearer ${openaiKey}`;
    urls.push("https://api.openai.com/v1/responses");
  }
  const started = Date.now();
  let lastError = "";
  for (const url of urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && azureKey && [404, 405].includes(response.status) && url.includes("/openai/v1/responses")) {
        lastError = JSON.stringify(data);
        continue;
      }
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || `Provider returned ${response.status}`);
      }
      const text = (data.output || [])
        .flatMap((item) => (item.type === "message" ? item.content || [] : []))
        .filter((part) => part.type === "output_text" || part.type === "text")
        .map((part) => part.text || "")
        .join("\n")
        .trim();
      return { parsed: JSON.parse(text), latency_ms: Date.now() - started, provider_response_id: data.id || "" };
    } catch (error) {
      lastError = error.message;
      if (!String(error.message || "").includes("404")) break;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(lastError || "Scenario LLM call failed.");
}

async function generateScenario(payload) {
  const curriculumRows = readCsv("curriculum_scenarios.csv");
  const generatedRows = readCsv("generated_scenarios.csv");
  const persona = personaFromPayload(payload);
  if (clean(payload.sourceScenarioMode) === "manual") {
    const sourceRow = findSourceRow(payload, curriculumRows);
    return deterministicScenario(payload, sourceRow);
  }
  const generatedSeed = findGeneratedSeed(payload, generatedRows);
  const generatedExamples = findGeneratedExamples(payload, generatedRows, generatedSeed);
  let result = await callScenarioLlm(payload, generatedSeed, generatedExamples);
  let generated = result.parsed;
  let repairCount = 0;
  let missingFactors = missingRequiredFactors(payload, generated);
  let metaSummary = summaryHasMetaLanguage(generated);
  let longSummary = summaryTooLong(generated);
  while ((missingFactors.length || metaSummary || longSummary) && repairCount < 2) {
    const repair = await callScenarioLlm(payload, generatedSeed, generatedExamples, {
      previous_packet: generated,
      missing_factor_labels: missingFactors,
      summary_style_issue: metaSummary ? "summary uses trainee/training meta-language; rewrite it as in-world case synopsis prose" : "",
      summary_length_issue: longSummary ? `summary is ${wordCount(generated.summary)} words; rewrite it to 35-65 words while preserving selected-factor coverage` : "",
    });
    result = {
      ...repair,
      latency_ms: result.latency_ms + repair.latency_ms,
      provider_response_id: [result.provider_response_id, repair.provider_response_id].filter(Boolean).join("|"),
    };
    generated = repair.parsed;
    repairCount += 1;
    missingFactors = missingRequiredFactors(payload, generated);
    metaSummary = summaryHasMetaLanguage(generated);
    longSummary = summaryTooLong(generated);
  }
  const factors = values(payload.scenarioFactors, payload.otherFactor);
  const complexities = values(payload.scenarioComplexities, payload.otherComplexity);
  const assignedName = assignAvatarName(payload, null, generated);
  return {
    scenario_id: `ui-generated-${Date.now().toString(36)}-${slug(generated.title)}`,
    title: clean(generated.title),
    avatar_name: assignedName.name,
    role: clean(generated.role) || controlValue(payload, "chatbotRole", "chatbotRoleOther") || "Complainant",
    summary: clean(generated.summary),
    opening_line: clean(generated.opening_line) || "Hi, I wanted to talk about something that happened.",
    public_facts: values(generated.public_facts),
    source: "i2st_ui_llm_generation",
    category: factors.join("|"),
    subcategory: complexities.join("|"),
    persona,
    authoring: {
      payload,
      sourceContext: null,
      generatedSeed: generatedSeed || null,
      generatedExamples,
      missingFactors,
      summaryWordCount: wordCount(generated.summary),
      inContextPersonaSummary: inContextPersonaSummaryFromPayload(payload),
      generatedBy: "ui-llm",
      nameGeneration: assignedName.meta,
      latency_ms: result.latency_ms,
      provider_response_id: result.provider_response_id,
      repair_count: repairCount,
    },
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function uiAuthoringPlugin() {
  return {
    name: "i2st-ui-authoring-api",
    configureServer(server) {
      server.middlewares.use("/ui-api/scenarios/generate", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "method_not_allowed" });
          return;
        }
        try {
          const payload = await readJsonBody(req);
          const scenario = await generateScenario(payload);
          sendJson(res, 200, scenario);
        } catch (error) {
          sendJson(res, 500, { error: "scenario_generation_failed", detail: error.message });
        }
      });
    },
  };
}
