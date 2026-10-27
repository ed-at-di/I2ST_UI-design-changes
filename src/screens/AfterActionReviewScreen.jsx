import { useState } from "react";
import { ArrowLeft, Download, MessageSquareText, RefreshCcw, Target, UsersRound } from "lucide-react";
import { activeScenarioStages } from "../lib/stageHelpers.js";

export function AfterActionReviewScreen({ scenario, form, messages, calls = [], busy, onReturnHome, onRunAgain }) {
  const stages = activeScenarioStages(form);
  const completedCalls = calls.filter((call) => call.messages.length);
  const [selectedCallIndex, setSelectedCallIndex] = useState(completedCalls[0]?.index || 0);
  const allMessages = completedCalls.flatMap((call) => call.messages);
  const activeCall = selectedCallIndex < 0 ? null : completedCalls.find((call) => call.index === selectedCallIndex) || completedCalls[0];
  const visibleMessages = activeCall?.messages || messages;
  const traineeMessages = allMessages.filter((message) => message.role === "trainee");
  const focusAreas = form.competencyFocuses || [];
  const behaviors = form.competencyBehaviorFocuses || [];

  function exportTranscript() {
    const title = scenario?.title || "Scenario Review";
    const transcript = completedCalls
      .map((call) => `CALL ${call.index + 1}: ${call.role}\n\n${call.messages.map((message) => `${message.role === "trainee" ? "Learner" : call.role}: ${message.text}`).join("\n\n")}`)
      .join("\n\n---\n\n");
    const file = new Blob([`${title}\nAfter Action Review Transcript\n\n${transcript}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "scenario"}-transcript.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="aarScreen">
      <section className="aarHero">
        <div>
          <span className="aarEyebrow">After Action Review</span>
          <h1>{scenario?.title || "Scenario Review"}</h1>
          <p>Review the interaction, connect decisions to the training focus, and identify one adjustment for the next attempt.</p>
        </div>
        <span className="aarCompleteBadge">Session complete</span>
      </section>

      <section className="aarMetrics" aria-label="Session summary">
        <article><MessageSquareText size={20} /><div><strong>{allMessages.length}</strong><span>Total messages</span></div></article>
        <article><Target size={20} /><div><strong>{traineeMessages.length}</strong><span>Learner responses</span></div></article>
        <article><UsersRound size={20} /><div><strong>{completedCalls.length} of {stages.length}</strong><span>Calls completed</span></div></article>
        <article><RefreshCcw size={20} /><div><strong>{completedCalls.length === stages.length ? "Complete" : "In progress"}</strong><span>Scenario status</span></div></article>
      </section>

      <div className="aarGrid">
        <section className="aarCard aarFocusCard">
          <div className="aarCardHeader"><div><span>Training focus</span><h2>KPA and behaviors</h2></div><Target size={20} /></div>
          <dl className="aarFocusList">
            <div><dt>KPA</dt><dd>{form.selectedKpa || "Not specified"}</dd></div>
            <div><dt>Focus areas</dt><dd>{focusAreas.join(", ") || "Not specified"}</dd></div>
            <div><dt>Behaviors emphasized</dt><dd>{behaviors.join(", ") || "Not specified"}</dd></div>
          </dl>
        </section>

        <section className="aarCard aarStagesCard">
          <div className="aarCardHeader"><div><span>Scenario structure</span><h2>Stages reviewed</h2></div><UsersRound size={20} /></div>
          <div className="aarStageList">
            {stages.map((stage, index) => {
              const role = stage.chatbotRole === "Other" ? stage.chatbotRoleOther : stage.chatbotRole;
              return <div key={stage.id}><strong>Stage {index + 1}</strong><span>{role || "Avatar role"}{stage.domainTitle ? ` · ${stage.domainTitle}` : ""}</span></div>;
            })}
          </div>
        </section>

        <section className="aarCard aarReflectionCard">
          <div className="aarCardHeader"><div><span>Guided reflection</span><h2>Questions for the learner</h2></div></div>
          <ol>
            <li>Which response helped the avatar share more useful information?</li>
            <li>Where could you have applied the selected behaviors more deliberately?</li>
            <li>What is one specific change you would make in another attempt?</li>
          </ol>
        </section>

        <section className="aarCard aarTranscriptCard">
          <div className="aarCardHeader">
            <div><span>Interaction evidence</span><h2>Transcript</h2></div>
            <button className="aarTranscriptExport" type="button" onClick={exportTranscript} disabled={!allMessages.length}>
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
          <div className="aarCallTabs" role="tablist" aria-label="Conversation scores and transcripts">
            <button className={!activeCall ? "active" : ""} type="button" onClick={() => setSelectedCallIndex(-1)}>Composite summary</button>
            {completedCalls.map((call) => <button className={activeCall?.index === call.index ? "active" : ""} type="button" key={call.index} onClick={() => setSelectedCallIndex(call.index)}>Call {call.index + 1}: {call.role}</button>)}
          </div>
          {!activeCall && <div className="aarCompositeSummary">
            {completedCalls.map((call) => <article key={call.index}><strong>Call {call.index + 1}: {call.role}</strong><span>{call.messages.filter((message) => message.role === "trainee").length} learner responses</span></article>)}
          </div>}
          <div className="aarTranscript">
            {activeCall && visibleMessages.map((message, index) => (
              <article className={message.role} key={`${message.role}-${index}`}>
                <span>{message.role === "trainee" ? "Learner" : activeCall.role}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="aarActions">
        <button className="secondaryButton" type="button" onClick={onReturnHome}><ArrowLeft size={16} /><span>Return Home</span></button>
        <button className="primaryButton" type="button" onClick={onRunAgain} disabled={busy}><RefreshCcw size={16} /><span>{busy ? "Starting…" : "Run Again"}</span></button>
      </footer>
    </main>
  );
}
