import {
  clean,
  formValue,
  parseCsv,
  selectedCompetencies,
  selectedList,
  sourceReference,
} from "../lib/scenarioHelpers.js";

const sessions = new Map();
let dataPromise;
const demoDataPath = (filename) => `${import.meta.env.BASE_URL}data/${filename}`;

const splitPipe = (value) =>
  String(value || "")
    .split("|")
    .map((item) => clean(item))
    .filter(Boolean);

const personaLabel = (row) =>
  [
    row.persona_style,
    row.persona_emotional_state || row.baseline_mood,
    row.persona_trust_level,
    row.persona_communication_style || row.communication_style,
    row.persona_primary_concern,
  ]
    .map(clean)
    .filter(Boolean)
    .join(" / ");

async function loadCsv(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load demo data from ${path}`);
  return parseCsv(await response.text());
}

async function loadData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      loadCsv(demoDataPath("generated_scenarios.csv")),
      loadCsv(demoDataPath("curriculum_scenarios.csv")),
    ]).then(([generated, curriculum]) => ({ generated, curriculum }));
  }
  return dataPromise;
}

function requestBody(options) {
  if (!options?.body) return {};
  if (typeof options.body === "string") return JSON.parse(options.body);
  return options.body;
}

function rowToScenario(row) {
  return {
    scenario_id: row.scenario_id,
    title: clean(row.title),
    role: clean(row.chatbot_role) || "Complainant",
    avatar_name: clean(row.avatar_name) || "Jordan",
    summary: clean(row.scenario_summary),
    opening_line: clean(row.opening_line) || "Hi, I wanted to talk about something that happened.",
    public_facts: splitPipe(row.public_facts),
    persona: {
      style: clean(row.persona_style),
      emotional_state: clean(row.persona_emotional_state || row.baseline_mood),
      trust_level: clean(row.persona_trust_level),
      communication_style: clean(row.persona_communication_style || row.communication_style),
      primary_concern: clean(row.persona_primary_concern),
      notes: clean(row.persona_notes),
      behavior_notes: clean(row.behavior_notes),
    },
  };
}

function catalogRows(rows) {
  const seen = new Set();
  return rows
    .filter((row) => {
      const key = `${clean(row.title)}|${clean(row.chatbot_role)}|${personaLabel(row)}`;
      if (!row.scenario_id || !row.title || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 18);
}

function chooseSeed(rows, payload) {
  const role = formValue(payload, "chatbotRole", "chatbotRoleOther").toLowerCase();
  const style = formValue(payload, "personaStyle", "personaStyleOther").toLowerCase();
  const factors = selectedList(payload.scenarioFactors || [], payload.otherFactor).map((item) => item.toLowerCase());

  return [...rows]
    .map((row) => {
      const text = [
        row.title,
        row.chatbot_role,
        row.persona_style,
        row.scenario_factors,
        row.category,
        row.subcategory,
      ]
        .join(" ")
        .toLowerCase();
      let score = 0;
      if (role && clean(row.chatbot_role).toLowerCase() === role) score += 8;
      if (style && clean(row.persona_style).toLowerCase() === style) score += 4;
      factors.forEach((factor) => {
        if (text.includes(factor)) score += 2;
      });
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.row;
}

function buildScenario(payload, generatedRows, curriculumRows) {
  const source =
    payload.sourceScenarioMode === "manual"
      ? curriculumRows.find((row) => row.curriculum_scenario_id === payload.curriculumScenarioId)
      : null;
  const seed = chooseSeed(generatedRows, payload) || generatedRows[0] || {};
  const role = formValue(payload, "chatbotRole", "chatbotRoleOther") || clean(seed.chatbot_role) || "Complainant";
  const factors = selectedList(payload.scenarioFactors || [], payload.otherFactor);
  const complexities = selectedList(payload.scenarioComplexities || [], payload.otherComplexity);
  const competencies = selectedCompetencies(payload);
  const sourceText = clean(source?.scenario_text);
  const summary =
    sourceText ||
    [
      clean(payload.scenarioSetting),
      clean(payload.scenarioBackground),
      clean(payload.scenarioTrigger),
      clean(payload.scenarioChallenge),
    ].filter(Boolean).join(" ") ||
    clean(seed.scenario_summary) ||
    `${role} reports a workplace concern involving ${factors.join(", ") || "professional conduct"} and wants a clear, fair response.`;
  const title =
    clean(payload.scenarioName) ||
    (source && clean(source.subcategory || source.category)
      ? `${role} Response: ${clean(source.subcategory || source.category)}`
      : clean(seed.title) || `${role}: Workplace Concern`);
  const persona = {
    style: formValue(payload, "personaStyle", "personaStyleOther") || clean(seed.persona_style),
    emotional_state:
      formValue(payload, "personaEmotionalState", "personaEmotionalStateOther") ||
      clean(seed.persona_emotional_state || seed.baseline_mood),
    trust_level: formValue(payload, "personaTrustLevel", "personaTrustLevelOther") || clean(seed.persona_trust_level),
    communication_style:
      formValue(payload, "personaCommunicationStyle", "personaCommunicationStyleOther") ||
      clean(seed.persona_communication_style || seed.communication_style),
    primary_concern:
      formValue(payload, "personaPrimaryConcern", "personaPrimaryConcernOther") || clean(seed.persona_primary_concern),
    notes: clean(payload.personaNotes || seed.persona_notes),
    behavior_notes: clean(payload.chatbotBehaviorNotes || seed.behavior_notes),
  };
  const publicFacts = sourceText ? [sourceText] : splitPipe(seed.public_facts);
  [payload.scenarioSetting, payload.scenarioBackground, payload.scenarioTrigger, payload.scenarioChallenge].map(clean).filter(Boolean).forEach((value) => publicFacts.push(value));
  if (payload.otherDetails) publicFacts.push(clean(payload.otherDetails));

  return {
    scenario_id: `demo-${Date.now().toString(36)}`,
    title,
    avatar_name: clean(seed.avatar_name) || "Jordan Blake",
    role,
    summary,
    opening_line: clean(seed.opening_line) || "Hi, I wanted to talk about something that happened at work.",
    public_facts: publicFacts.length ? publicFacts : [summary],
    persona,
    stages: Array.isArray(payload.stages) ? payload.stages.slice(0, Number(payload.stageCount) || 1) : [],
    authoring: {
      payload,
      generatedBy: "dataset-demo",
      sourceContext: source
        ? {
            scenario: source,
            reference: sourceReference(source),
          }
        : {},
      inContextPersonaSummary: [
        role,
        persona.style,
        persona.emotional_state,
        persona.trust_level,
        persona.communication_style,
        persona.primary_concern,
      ]
        .filter(Boolean)
        .join(" / "),
      competencyFocus: competencies,
      factors,
      complexities,
    },
  };
}

function replyFor(session, message) {
  const scenario = session.scenario;
  const text = message.toLowerCase();
  const facts = scenario.public_facts?.length ? scenario.public_facts : [scenario.summary];
  const fact = facts[session.turn % facts.length] || scenario.summary;
  const concern = scenario.persona?.primary_concern || "whether this will be handled fairly";
  const cautious = scenario.persona?.trust_level?.toLowerCase().includes("low");

  if (/(what happened|tell me|describe|start|begin)/.test(text)) {
    return `${fact} ${cautious ? "I wasn't sure whether bringing it up would make things worse, but I didn't think I could ignore it." : "That's the main reason I decided to speak with you."}`;
  }
  if (/(safe|retaliat|privacy|confiden|trust)/.test(text)) {
    return `My biggest concern is ${concern.toLowerCase()}. I need to understand who will see this information and what happens if the situation gets worse after I report it.`;
  }
  if (/(document|record|write|detail|when|where|who)/.test(text)) {
    return `I can give you the details I remember, and I want them documented accurately. ${fact}`;
  }
  if (/(next|process|follow|report|option|action)/.test(text)) {
    return "I want to know what the next step is, who is responsible for it, and when I should expect to hear back. I don't need promises—I need a clear process.";
  }
  if (/(sorry|understand|hear you|thank)/.test(text)) {
    return `I appreciate you saying that. I'm still ${scenario.persona?.emotional_state?.toLowerCase() || "concerned"}, but it helps to know you're listening before deciding what happened.`;
  }

  const followUps = [
    `That's part of it, but I don't want the main concern to get lost: ${concern.toLowerCase()}.`,
    `I can answer that. I just need you to be specific about what information you need and why.`,
    `What would help me most right now is knowing that this will be documented and followed up on.`,
  ];
  return followUps[(session.turn - 1) % followUps.length];
}

async function pause(min = 180, spread = 260) {
  const delay = min + Math.round(Math.random() * spread);
  await new Promise((resolve) => window.setTimeout(resolve, delay));
  return delay;
}

export async function demoApi(path, options = {}) {
  const { generated, curriculum } = await loadData();

  if (path === "/health") {
    return { ok: true, sessions: sessions.size };
  }

  if (path === "/catalog/ui") {
    const rows = catalogRows(generated);
    return {
      curriculumScenarios: curriculum,
      scenarios: rows.map((row) => ({
        scenario_id: row.scenario_id,
        title: clean(row.title),
        role: clean(row.chatbot_role),
        persona: personaLabel(row),
      })),
      personas: rows.map((row) => ({ key: clean(row.persona_style), label: personaLabel(row) })),
      counts: {
        curriculumScenarios: curriculum.length,
        scenarios: rows.length,
        personas: rows.length,
      },
    };
  }

  if (path === "/sessions") {
    const payload = requestBody(options);
    const scenario =
      typeof payload.scenario === "string"
        ? rowToScenario(generated.find((row) => row.scenario_id === payload.scenario) || generated[0] || {})
        : payload.scenario;
    const latency = await pause(320, 360);
    const sessionId = `demo-session-${sessions.size + 1}`;
    sessions.set(sessionId, { scenario, turn: 0 });
    return {
      session_id: sessionId,
      scenario: scenario.scenario_id,
      persona: Object.values(scenario.persona || {}).filter(Boolean).slice(0, 5).join(" / "),
      avatar: scenario.opening_line || "Hi, I wanted to talk about something that happened.",
      latency_ms: latency,
    };
  }

  const turnMatch = path.match(/^\/sessions\/([^/]+)\/turns$/);
  if (turnMatch) {
    const session = sessions.get(turnMatch[1]);
    if (!session) throw new Error("Session not found");
    session.turn += 1;
    const latency = await pause(620, 780);
    return {
      session_id: turnMatch[1],
      turn_number: session.turn,
      avatar: replyFor(session, clean(requestBody(options).message)),
      latency_ms: latency,
      fallback: false,
      repair_used: false,
    };
  }

  throw new Error(`Demo endpoint not found: ${path}`);
}

export async function demoUiApi(path, options = {}) {
  if (path !== "/scenarios/generate") throw new Error(`Demo endpoint not found: ${path}`);
  const { generated, curriculum } = await loadData();
  await pause(420, 420);
  return buildScenario(requestBody(options), generated, curriculum);
}
