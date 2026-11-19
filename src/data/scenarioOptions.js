export const CHATBOT_ROLES = ["Complainant", "Witness", "Subject", "Other"];

export const DOMAIN_OPTIONS = ["Civilian", "Military"];

export const MILITARY_BRANCH_OPTIONS = [
  "Air Force",
  "Army",
  "Coast Guard",
  "Marine Corps",
  "Navy",
  "Space Force",
];

export const KPA_OPTIONS = ["EO Interpersonal Skills"];

function ratingBehavior(title, descriptions) {
  return {
    title,
    rate_anchors: descriptions.map((description, index) => ({ rate: index + 1, description })),
  };
}

// Mock rubric structure until the connected application provides KPA data.
export const KPA_BEHAVIOR_GROUPS = {
  "EO Interpersonal Skills": [
    {
      title: "Empathy & Support",
      details: [
        ratingBehavior("Empathy & Reassurance", [
          "Shows little to no empathy; minimal reassurance; unaware of emotional cues.",
          "Occasionally shows empathy; offers generic reassurance; inconsistent in recognizing emotions.",
          "Displays empathy; offers reassurance; generally recognizes emotional cues.",
          "Consistently empathetic; provides tailored reassurance; sensitive to a range of emotional cues.",
          "Exemplifies deep empathy; always reassures effectively; intuitively understands and responds to emotions.",
        ]),
        ratingBehavior("Active Listening", [
          "Rarely listens attentively; frequently interrupts or shifts focus.",
          "Listens intermittently; engages with key points but interrupts.",
          "Listens actively; summarizes and avoids interruptions.",
          "Demonstrates active listening consistently; paraphrases and encourages deeper conversation.",
          "Exemplifies impeccable listening; synthesizes information and responds thoughtfully; fully engaged.",
        ]),
        ratingBehavior("Crisis Management", [
          "Struggles to manage the situation; appears visibly flustered or dismissive. Reacts inappropriately or fails to respond.",
          "Handles basic aspects of the situation but may be reactive or inconsistent.",
          "Manages the situation effectively; remains calm and provides standard solutions.",
          "Proactively handles the situation; de-escalates emotions and anticipates challenges.",
          "Expertly navigates complex crises; remains composed, strategic, and sensitive under pressure.",
        ]),
      ],
    },
    { title: "Communication Skills", details: ["Clarity of Communication", "Questioning Technique"] },
    { title: "Credibility & Problem-Solving", details: ["Resolution & Procedural Competency", "Documenting Information"] },
  ],
};

export const COMPETENCY_OPTIONS = [
  { title: "Empathy & Support", details: ["Empathy & Reassurance", "Active Listening", "Crisis Management"] },
  {
    title: "Communication Skills",
    details: ["Clarity of Communication", "Non-Verbal Communication", "Questioning Technique", "Professionalism & Composure"],
  },
  { title: "Credibility & Problem-Solving", details: ["Resolution & Procedural Competency", "Documenting Information"] },
];

export const FACTOR_OPTIONS = [
  "Race/Ethnicity",
  "Sex",
  "Religion",
  "Sexual Orientation",
  "Disability-Based",
  "Age",
  "National Origin",
  "Pregnancy/Parental Issue",
  "Military/Veteran Status",
  "Other",
];

export const MILITARY_FACTOR_OPTIONS = ["Race", "Color", "Religion", "Sex", "National Origin", "Other"];

export function factorsForDomain(domain) {
  return domain === "Military" ? MILITARY_FACTOR_OPTIONS : FACTOR_OPTIONS;
}

export function normalizeDomainFactors(factors, domain) {
  const allowed = factorsForDomain(domain);
  return [...new Set(factors.map((factor) => domain === "Military" && factor === "Race/Ethnicity" ? "Race" : domain === "Civilian" && factor === "Race" ? "Race/Ethnicity" : factor))].filter((factor) => allowed.includes(factor));
}

export const COMPLEXITY_OPTIONS = [
  "Maximized Emotional Intensity",
  "Organizational and Systemic Challenges",
  "Ethical Dilemmas and Ambiguity",
  "Other",
];

export const PERSONA_STYLE_OPTIONS = [
  "Frustrated Skeptic",
  "Reluctant Witness",
  "Defensive Respondent",
  "Anxious Reporter",
  "Over-Explaining Narrator",
  "Cautious Professional",
  "Other",
];

export const PERSONA_EMOTIONAL_STATE_OPTIONS = ["Frustrated", "Anxious", "Defensive", "Guarded", "Confused", "Overwhelmed", "Other"];

export const PERSONA_TRUST_LEVEL_OPTIONS = ["Low trust", "Mixed trust", "Cautiously cooperative", "High trust but worried", "Other"];

export const PERSONA_COMMUNICATION_STYLE_OPTIONS = [
  "Direct and brief",
  "Detailed and narrative",
  "Hesitant and careful",
  "Emotional and urgent",
  "Formal and guarded",
  "Other",
];

export const PERSONA_PRIMARY_CONCERN_OPTIONS = [
  "Being dismissed",
  "Retaliation",
  "Privacy and confidentiality",
  "Fair process",
  "Being blamed",
  "Immediate safety",
  "Other",
];

export const EVIDENCE_OPTIONS = [
  "System-recorded transcript",
  "Observation checklist / rubric",
  "Recorded learner decision",
  "Written or verbal reflection",
  "Discussion response",
  "Other",
];

export const DEFAULT_FORM = {
  sourceScenarioMode: "auto",
  curriculumScenarioId: "",
  chatbotRole: "Complainant",
  chatbotRoleOther: "",
  competencyFocus: "Empathy & Support",
  competencyFocuses: ["Empathy & Support"],
  competencyBehaviorFocuses: ["Empathy & Reassurance", "Active Listening", "Crisis Management"],
  selectedKpa: "EO Interpersonal Skills",
  performanceObjective: "",
  domainType: "Civilian",
  militaryBranch: "",
  scenarioFactors: ["Sexual Orientation", "Pregnancy/Parental Issue"],
  scenarioComplexities: ["Maximized Emotional Intensity"],
  otherFactor: "",
  otherComplexity: "",
  scenarioSetting: "",
  scenarioBackground: "",
  scenarioTrigger: "",
  scenarioChallenge: "",
  chatbotBehaviorNotes: "",
  otherDetails: "",
  decisionPoints: [{ cue: "", learnerBehavior: "", consequence: "" }],
  successCriteria: [
    { description: "", kpa: "" },
    { description: "", kpa: "" },
  ],
  evidenceMethods: [],
  evidenceOther: "",
  criticalErrors: [""],
  debriefQuestions: ["", ""],
  stageCount: 1,
  stages: [
    {
      id: "stage-1",
      name: "Stage 1",
      chatbotRole: "Complainant",
      chatbotRoleOther: "",
      chatbotBehaviorNotes: "",
      personaStyle: "Frustrated Skeptic",
      personaStyleOther: "",
      personaEmotionalState: "Frustrated",
      personaEmotionalStateOther: "",
      personaTrustLevel: "Low trust",
      personaTrustLevelOther: "",
      personaCommunicationStyle: "Direct and brief",
      personaCommunicationStyleOther: "",
      personaPrimaryConcern: "Being dismissed",
      personaPrimaryConcernOther: "",
      personaNotes: "",
    },
  ],
  personaStyle: "Frustrated Skeptic",
  personaStyleOther: "",
  personaEmotionalState: "Frustrated",
  personaEmotionalStateOther: "",
  personaTrustLevel: "Low trust",
  personaTrustLevelOther: "",
  personaCommunicationStyle: "Direct and brief",
  personaCommunicationStyleOther: "",
  personaPrimaryConcern: "Being dismissed",
  personaPrimaryConcernOther: "",
  personaNotes: "",
  difficulty: "Expert",
};

export const NEW_SCENARIO_FORM = {
  ...DEFAULT_FORM,
  sourceScenarioMode: "auto",
  chatbotRole: "Complainant",
  competencyFocus: "",
  competencyFocuses: [],
  competencyBehaviorFocuses: [],
  selectedKpa: "",
  performanceObjective: "",
  domainType: "",
  militaryBranch: "",
  scenarioFactors: [],
  scenarioComplexities: [],
  stageCount: 1,
  stages: [
    {
      id: "stage-1",
      name: "Stage 1",
      chatbotRole: "Complainant",
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
    },
  ],
  personaStyle: "",
  personaEmotionalState: "",
  personaTrustLevel: "",
  personaCommunicationStyle: "",
  personaPrimaryConcern: "",
};
