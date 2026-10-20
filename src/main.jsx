import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import XLSX from "xlsx-js-style";
import { RuntimeChatScreen } from "./chatbot-ui/RuntimeChatScreen.jsx";
import { AppHeader } from "./components/AppHeader.jsx";
import { HomeScreen } from "./screens/HomeScreen.jsx";
import { LoginScreen } from "./screens/LoginScreen.jsx";
import { AfterActionReviewScreen } from "./screens/AfterActionReviewScreen.jsx";
import { CallLobbyScreen } from "./screens/CallLobbyScreen.jsx";
import { ScenarioWizard, STEPS, wizardStepsForMode } from "./wizard/ScenarioWizard.jsx";
import { COMPETENCY_OPTIONS, DEFAULT_FORM, NEW_SCENARIO_FORM } from "./data/scenarioOptions.js";
import { demoApi, demoUiApi } from "./demo/demoApi.js";
import {
  competencyDetails,
  firstSource,
  formatLatency,
  loadLocalCurriculumRows,
  previewFromFormOrScenario,
  scenarioFromCatalogItem,
  selectedCompetencies,
  selectedCompetencyBehaviors,
  sourceLabel,
  writeScenarioWorkbook,
} from "./lib/scenarioHelpers.js";
import { activeScenarioStages, stageCountFromForm } from "./lib/stageHelpers.js";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css";
import "./styles.css";

const API_BASE = "/chatbot";
const DEMO_MODE = import.meta.env.MODE === "demo" || import.meta.env.VITE_DEMO_MODE === "true";

async function api(path, options = {}) {
  if (DEMO_MODE) return demoApi(path, options);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!response.ok) {
    throw new Error(data.detail || `Request failed with status ${response.status}`);
  }
  return data;
}

async function uiApi(path, options = {}) {
  if (DEMO_MODE) return demoUiApi(path, options);
  const response = await fetch(`/ui-api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

function App() {
  const [theme, setTheme] = useState(() => window.localStorage.getItem("i2st-theme") || "light");
  const [catalog, setCatalog] = useState({ curriculumScenarios: [], scenarios: [], personas: [], counts: {} });
  const [health, setHealth] = useState({ ok: false, sessions: 0 });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [scenario, setScenario] = useState(null);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [runtimeStageIndex, setRuntimeStageIndex] = useState(0);
  const [runtimeStageRuns, setRuntimeStageRuns] = useState({});
  const [completedCallIndexes, setCompletedCallIndexes] = useState([]);
  const [input, setInput] = useState("");
  const [view, setView] = useState("login"); // "login" | "home" | "wizard" | "lobby" | "runtime" | "aar"
  const [wizardStep, setWizardStep] = useState(0);
  const [visitedWizardSteps, setVisitedWizardSteps] = useState(() => new Set([0]));
  const [creationMode, setCreationMode] = useState("new"); // "new" | "existing"
  const [existingOriginalName, setExistingOriginalName] = useState("");
  const [existingCopyName, setExistingCopyName] = useState("");
  const [existingCopySaved, setExistingCopySaved] = useState(false);
  const [existingCopyDirty, setExistingCopyDirty] = useState(false);
  const [draftActive, setDraftActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const scrollRef = useRef(null);

  const source = useMemo(() => firstSource(catalog, form), [catalog, form]);
  const preview = useMemo(() => previewFromFormOrScenario(scenario, form, source), [scenario, form, source]);
  const isManualSource = form.sourceScenarioMode === "manual";
  const competencies = selectedCompetencies(form);

  function suggestedCopyName(originalName) {
    return `${originalName || "Scenario"} 02`;
  }

  function prepareExistingCopy(originalName) {
    setExistingOriginalName(originalName);
    setExistingCopyName(suggestedCopyName(originalName));
    setExistingCopySaved(false);
    setExistingCopyDirty(false);
  }

  function updateForm(patch) {
    if (creationMode === "existing" && view === "wizard") {
      if (patch.curriculumScenarioId) {
        const selectedSource = catalog.curriculumScenarios.find(
          (item) => item.curriculum_scenario_id === patch.curriculumScenarioId
        );
        prepareExistingCopy(sourceLabel(selectedSource, catalog.curriculumScenarios));
      } else {
        setExistingCopySaved(false);
        setExistingCopyDirty(true);
      }
    }
    setForm((current) => ({ ...current, ...patch }));
    setScenario(null);
    setSession(null);
    setMessages([]);
    setStatus("");
  }

  function navigateWizardStep(nextStep) {
    setWizardStep(nextStep);
    setVisitedWizardSteps((current) => new Set([...current, nextStep]));
  }

  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const [healthResult, catalogResult, localCurriculumRows] = await Promise.all([
        api("/health").catch(() => ({ ok: false, sessions: 0 })),
        api("/catalog/ui"),
        loadLocalCurriculumRows(),
      ]);
      setHealth(healthResult);
      const curriculumScenarios = localCurriculumRows.length ? localCurriculumRows : catalogResult.curriculumScenarios || [];
      setCatalog({
        ...catalogResult,
        curriculumScenarios,
        counts: {
          ...(catalogResult.counts || {}),
          curriculumScenarios: curriculumScenarios.length,
        },
      });
      setForm((current) => ({
        ...current,
        curriculumScenarioId: current.curriculumScenarioId || curriculumScenarios[0]?.curriculum_scenario_id || "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("i2st-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!messages.length) return;
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  function payloadFromForm() {
    const focusTitles = selectedCompetencies(form);
    const focusBehaviors = selectedCompetencyBehaviors(form);
    const stages = activeScenarioStages(form);
    return {
      ...form,
      stageCount: stageCountFromForm(form),
      stages,
      competencyFocus: focusTitles.join(", "),
      competencyFocuses: focusTitles,
      competencyFocusDetails: focusBehaviors.length ? focusBehaviors : competencyDetails(focusTitles),
      evaluationKpa: form.selectedKpa,
      evaluationCompetencyFocuses: COMPETENCY_OPTIONS.map((option) => option.title),
      curriculumScenarioId: isManualSource ? form.curriculumScenarioId || source?.curriculum_scenario_id || "" : "",
      scenarioName: creationMode === "existing" ? existingCopyName.trim() : "",
    };
  }

  function scenarioForStage(baseScenario, stage, stageIndex) {
    if (!stage) return baseScenario;
    const role = stage.chatbotRole === "Other" ? stage.chatbotRoleOther : stage.chatbotRole;
    return {
      ...baseScenario,
      role: role || baseScenario.role,
      active_stage_index: stageIndex,
      active_stage_name: stage.name || `Stage ${stageIndex + 1}`,
      persona: {
        ...(baseScenario.persona || {}),
        style: stage.personaStyle === "Other" ? stage.personaStyleOther : stage.personaStyle,
        emotional_state: stage.personaEmotionalState === "Other" ? stage.personaEmotionalStateOther : stage.personaEmotionalState,
        trust_level: stage.personaTrustLevel === "Other" ? stage.personaTrustLevelOther : stage.personaTrustLevel,
        communication_style: stage.personaCommunicationStyle === "Other" ? stage.personaCommunicationStyleOther : stage.personaCommunicationStyle,
        primary_concern: stage.personaPrimaryConcern === "Other" ? stage.personaPrimaryConcernOther : stage.personaPrimaryConcern,
        notes: stage.personaNotes || "",
        behavior_notes: stage.chatbotBehaviorNotes || "",
      },
    };
  }

  async function requestScenarioPacket() {
    const result = await uiApi("/scenarios/generate", {
      method: "POST",
      body: JSON.stringify(payloadFromForm()),
    });
    if (creationMode !== "existing" || !existingCopyName.trim()) return result;
    return {
      ...result,
      title: existingCopyName.trim(),
      preview: {
        ...(result.preview || {}),
        scenarioTitle: existingCopyName.trim(),
      },
    };
  }

  async function generateScenario() {
    setBusy(true);
    setError("");
    setStatus("");
    const started = performance.now();
    try {
      const result = await requestScenarioPacket();
      setScenario(result);
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      setStatus(isManualSource ? `Source scenario loaded in ${elapsed} ms` : `Scenario generated in ${elapsed} ms`);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function openChatSession(activeScenario, stageIndex = 0) {
    const stages = activeScenarioStages(form);
    const stageScenario = scenarioForStage(activeScenario, stages[stageIndex], stageIndex);
    const result = await api("/sessions", {
      method: "POST",
      body: JSON.stringify({ scenario: activeScenario.isCatalogStub ? activeScenario.scenario_id : stageScenario }),
    });
    if (!result?.session_id) throw new Error("The chat session did not return a session ID.");
    const initialMessages = [{ role: "avatar", text: result.avatar || "No response returned.", latencyMs: result.latency_ms }];
    setRuntimeStageIndex(stageIndex);
    setSession(result);
    setMessages(initialMessages);
    setRuntimeStageRuns((current) => ({
      ...current,
      [stageIndex]: { session: result, messages: initialMessages },
    }));
    setStatus(`Call ${stageIndex + 1} started · ${formatLatency(result.latency_ms)}`);
    setView("runtime");

    // Session startup should not be blocked by this secondary status refresh.
    void api("/health")
      .then((healthResult) => {
        if (healthResult) setHealth(healthResult);
      })
      .catch(() => {});
  }

  async function startSession() {
    setBusy(true);
    setError("");
    setMessages([]);
    try {
      setRuntimeStageRuns({});
      setRuntimeStageIndex(0);
      let activeScenario = scenario;
      if (!activeScenario) {
        const result = await requestScenarioPacket();
        setScenario(result);
        activeScenario = result;
      }
      await openChatSession(activeScenario, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openCallLobby() {
    setBusy(true);
    setError("");
    try {
      let selectedScenario = scenario;
      if (!selectedScenario) {
        selectedScenario = await requestScenarioPacket();
        setScenario(selectedScenario);
      }
      if (!selectedScenario?.title && !selectedScenario?.scenario_id) {
        throw new Error("The scenario could not be prepared for the call lobby.");
      }
      setSession(null);
      setMessages([]);
      setCompletedCallIndexes([]);
      setView("lobby");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function joinScheduledCall(stageIndex) {
    if (stageIndex === 0 && !runtimeStageRuns[0]) {
      await startSession();
      return;
    }
    await selectRuntimeStage(stageIndex);
  }

  function finishRuntimeCall() {
    setRuntimeStageRuns((current) => ({
      ...current,
      [runtimeStageIndex]: { session, messages },
    }));
    setCompletedCallIndexes((current) => [...new Set([...current, runtimeStageIndex])]);
    setInput("");
    if (runtimeStageIndex >= activeScenarioStages(form).length - 1) {
      endTrainingSession();
    } else {
      setStatus(`Call ${runtimeStageIndex + 1} completed`);
      setView("lobby");
    }
  }

  async function selectRuntimeStage(nextStageIndex) {
    if (nextStageIndex === runtimeStageIndex || busy) return;
    setRuntimeStageRuns((current) => ({
      ...current,
      [runtimeStageIndex]: { session, messages },
    }));

    const previousRun = runtimeStageRuns[nextStageIndex];
    if (previousRun) {
      setRuntimeStageIndex(nextStageIndex);
      setSession(previousRun.session);
      setMessages(previousRun.messages);
      setInput("");
      setError("");
      setStatus(`Returned to Call ${nextStageIndex + 1}`);
      return;
    }

    setBusy(true);
    setError("");
    setInput("");
    try {
      await openChatSession(scenario, nextStageIndex);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function exportScenarioExcel() {
    setBusy(true);
    setError("");
    try {
      let activeScenario = scenario;
      if (!activeScenario) {
        activeScenario = await requestScenarioPacket();
        setScenario(activeScenario);
      }
      writeScenarioWorkbook(XLSX, activeScenario);
      setStatus("Scenario export created");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendTurn(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !session?.session_id || busy) return;
    setInput("");
    setBusy(true);
    setError("");
    setMessages((current) => {
      const nextMessages = [...current, { role: "trainee", text }];
      setRuntimeStageRuns((runs) => ({ ...runs, [runtimeStageIndex]: { session, messages: nextMessages } }));
      return nextMessages;
    });
    try {
      const result = await api(`/sessions/${session.session_id}/turns`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((current) => {
        const nextMessages = [
          ...current,
          {
          role: "avatar",
          text: result.avatar || "No response returned.",
          latencyMs: result.latency_ms,
          fallback: result.fallback,
          repairUsed: result.repair_used,
          },
        ];
        setRuntimeStageRuns((runs) => ({ ...runs, [runtimeStageIndex]: { session, messages: nextMessages } }));
        return nextMessages;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function resetForm(overrides = {}) {
    setForm({
      ...DEFAULT_FORM,
      curriculumScenarioId: catalog.curriculumScenarios?.[0]?.curriculum_scenario_id || "",
      ...overrides,
    });
    setScenario(null);
    setSession(null);
    setMessages([]);
    setRuntimeStageIndex(0);
    setRuntimeStageRuns({});
    setCompletedCallIndexes([]);
    setStatus("");
    setError("");
  }

  function startNewScenario() {
    resetForm(NEW_SCENARIO_FORM);
    setCreationMode("new");
    setExistingOriginalName("");
    setExistingCopyName("");
    setExistingCopySaved(false);
    setExistingCopyDirty(false);
    setWizardStep(1);
    setVisitedWizardSteps(new Set([1]));
    setDraftActive(true);
    setView("wizard");
  }

  function startFromExistingScenario() {
    const initialSource = catalog.curriculumScenarios[0];
    resetForm({ sourceScenarioMode: "manual" });
    setCreationMode("existing");
    prepareExistingCopy(sourceLabel(initialSource, catalog.curriculumScenarios));
    setWizardStep(0);
    setVisitedWizardSteps(new Set([0]));
    setDraftActive(true);
    setView("wizard");
  }

  async function openAssignedScenario(item) {
    const activeScenario = scenarioFromCatalogItem(item);
    setError("");
    setMessages([]);
    setScenario(activeScenario);
    setDraftActive(false);
    setCompletedCallIndexes([]);
    setView("lobby");
  }

  function updateExistingCopyName(value) {
    setExistingCopyName(value);
    setExistingCopySaved(false);
    setExistingCopyDirty(true);
    setScenario(null);
    setSession(null);
    setMessages([]);
    setStatus("");
  }

  function saveExistingCopy() {
    const name = existingCopyName.trim();
    if (!name || name === existingOriginalName.trim()) return;
    setExistingCopyName(name);
    setExistingCopySaved(true);
    setExistingCopyDirty(false);
    setStatus(`Saved as “${name}”`);
  }

  function returnHome() {
    setView("home");
    loadCatalog();
  }

  function returnFromCallLobby() {
    if (draftActive) {
      setView("wizard");
      return;
    }
    returnHome();
  }

  function endTrainingSession() {
    setInput("");
    setStatus("Training session ended");
    setView("aar");
  }

  function finishAfterActionReview() {
    setSession(null);
    setMessages([]);
    setInput("");
    setDraftActive(false);
    setView("home");
    loadCatalog();
  }

  function resumeDraft() {
    setView(session ? "runtime" : "wizard");
  }

  function deleteDraft() {
    resetForm();
    setWizardStep(0);
    setVisitedWizardSteps(new Set([0]));
    setDraftActive(false);
  }

  function signOut() {
    resetForm();
    setSession(null);
    setMessages([]);
    setInput("");
    setDraftActive(false);
    setView("login");
  }

  function signIn() {
    setView("home");
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const draftRoleLabel = (form.chatbotRole === "Other" ? form.chatbotRoleOther : form.chatbotRole) || "Scenario";
  const draftSteps = creationMode === "new" ? STEPS.filter((item) => item.key !== "source") : STEPS;
  const draftStepIndex = Math.max(0, draftSteps.findIndex((item) => item.key === STEPS[wizardStep]?.key));
  const draft = draftActive
    ? {
        title:
          scenario?.title ||
          (creationMode === "existing" ? existingCopyName : "") ||
          preview.scenarioTitle ||
          `${draftRoleLabel}: Draft Scenario`,
        role: scenario?.role || draftRoleLabel,
        stepLabel: session ? "In chat" : `Step ${draftStepIndex + 1} of ${draftSteps.length} · ${STEPS[wizardStep]?.label}`,
      }
    : null;

  let body;
  if (view === "login") {
    body = <LoginScreen onLogin={signIn} theme={theme} />;
  } else if (view === "runtime" && session) {
    const runtimeStages = activeScenarioStages(form);
    body = (
      <RuntimeChatScreen
        busy={busy}
        error={error}
        formatLatency={formatLatency}
        input={input}
        messages={messages}
        scenario={scenario}
        scrollRef={scrollRef}
        sendTurn={sendTurn}
        session={session}
        setInput={setInput}
        stages={runtimeStages}
        activeStageIndex={runtimeStageIndex}
        onSelectStage={selectRuntimeStage}
        completedCalls={completedCallIndexes}
        onFinishCall={finishRuntimeCall}
      />
    );
  } else if (view === "lobby" && scenario) {
    body = (
      <CallLobbyScreen
        scenario={scenario}
        characters={activeScenarioStages(form)}
        completedCalls={completedCallIndexes}
        busy={busy}
        onJoin={joinScheduledCall}
        onBack={returnFromCallLobby}
        backLabel={draftActive ? "Back to scenario creation" : "Back to scenarios"}
      />
    );
  } else if (view === "aar" && session) {
    body = (
      <AfterActionReviewScreen
        scenario={scenario}
        form={form}
        messages={messages}
        busy={busy}
        onReturnHome={finishAfterActionReview}
        onRunAgain={startSession}
      />
    );
  } else if (view === "wizard") {
    body = (
      <ScenarioWizard
        step={wizardStep}
        setStep={navigateWizardStep}
        visitedSteps={visitedWizardSteps}
        form={form}
        updateForm={updateForm}
        catalog={catalog}
        source={source}
        isManualSource={isManualSource}
        competencies={competencies}
        scenario={scenario}
        preview={preview}
        status={status}
        error={error}
        busy={busy}
        loading={loading}
        onRegenerate={generateScenario}
        onExport={exportScenarioExcel}
        onStartChat={openCallLobby}
        creationMode={creationMode}
        existingCopyName={existingCopyName}
        existingOriginalName={existingOriginalName}
        existingCopySaved={existingCopySaved}
        existingCopyDirty={existingCopyDirty}
        onExistingCopyNameChange={updateExistingCopyName}
        onSaveExistingCopy={saveExistingCopy}
      />
    );
  } else {
    body = (
      <HomeScreen
        scenarios={catalog.scenarios || []}
        loading={loading}
        onCreateNew={startNewScenario}
        onCreateFromExisting={startFromExistingScenario}
        onOpenAssignedScenario={openAssignedScenario}
        draft={draft}
        onResumeDraft={resumeDraft}
        onDeleteDraft={deleteDraft}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className={`appShell appShell-${view}`} data-theme={theme}>
      {view !== "login" && (
        <AppHeader
          themeToggle={view === "home" ? { theme, onToggle: toggleTheme } : undefined}
          runtimeSession={
            view === "runtime" && session
              ? {
                  title: scenario?.title || scenario?.preview?.scenarioTitle || "Scenario session",
                  stageLabel: `Call ${runtimeStageIndex + 1} of ${activeScenarioStages(form).length} · ${(() => {
                    const stage = activeScenarioStages(form)[runtimeStageIndex];
                    return (stage?.chatbotRole === "Other" ? stage.chatbotRoleOther : stage?.chatbotRole) || "Avatar";
                  })()}`,
                  onEndSession: endTrainingSession,
                }
              : undefined
          }
          aarNavigation={
            view === "aar"
              ? {
                  onHome: finishAfterActionReview,
                  onExport: exportScenarioExcel,
                  exportDisabled: busy || !scenario,
                }
              : undefined
          }
          wizardNavigation={
            view === "wizard"
              ? {
                  steps: wizardStepsForMode(creationMode),
                  step: wizardStep,
                  visitedSteps: visitedWizardSteps,
                  onStepChange: navigateWizardStep,
                  onExitToHome: returnHome,
                }
              : undefined
          }
        />
      )}
      {body}
    </div>
  );
}

const appRoot = window.__i2stReactRoot || createRoot(document.getElementById("root"));
window.__i2stReactRoot = appRoot;
appRoot.render(<App />);
