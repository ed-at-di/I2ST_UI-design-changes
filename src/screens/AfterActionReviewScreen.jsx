import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Download, RefreshCcw } from "lucide-react";
import { KPA_BEHAVIOR_GROUPS } from "../data/scenarioOptions.js";
import { activeScenarioStages } from "../lib/stageHelpers.js";

const SAMPLE_SCORES = [4, 3, 3, 4, 3, 4, 3];

export function AfterActionReviewScreen({ scenario, form, messages = [], calls = [], busy, onReturnHome, onRunAgain }) {
  const stages = activeScenarioStages(form);
  const reviewedCalls = calls.length ? calls : [{ index: 0, role: scenario?.role || "Character", messages }];
  const [selectedCallIndex, setSelectedCallIndex] = useState(-1);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState(null);
  const activeCall = reviewedCalls.find((call) => call.index === selectedCallIndex);
  const visibleCalls = activeCall ? [activeCall] : reviewedCalls;
  const allMessages = reviewedCalls.flatMap((call) => call.messages);
  const groups = (KPA_BEHAVIOR_GROUPS[form.selectedKpa] || []).map((group) => ({ ...group, details: group.details.filter((behavior) => (form.competencyBehaviorFocuses || []).includes(behavior)) })).filter((group) => group.details.length);
  const behaviors = groups.flatMap((group) => group.details);
  const learnerExcerpts = visibleCalls.flatMap((call) => call.messages.map((message, index) => ({ ...message, key: `${call.index}-${index}` }))).filter((message) => message.role === "trainee");
  const hasEvidence = learnerExcerpts.length > 0;
  function scoreFor(behavior) {
    if (!hasEvidence) return null;
    const index = behaviors.indexOf(behavior);
    if (activeCall) return SAMPLE_SCORES[(index + activeCall.index) % SAMPLE_SCORES.length];
    const scoredCalls = reviewedCalls.filter((call) => call.messages.some((message) => message.role === "trainee"));
    return scoredCalls.reduce((sum, call) => sum + SAMPLE_SCORES[(index + call.index) % SAMPLE_SCORES.length], 0) / scoredCalls.length;
  }
  const overall = behaviors.length && hasEvidence ? (behaviors.reduce((sum, behavior) => sum + scoreFor(behavior), 0) / behaviors.length).toFixed(1) : null;
  const evidenceFor = (behavior) => learnerExcerpts.length ? [learnerExcerpts[behaviors.indexOf(behavior) % learnerExcerpts.length].key] : [];
  const linkedBehaviors = selectedExcerpt ? behaviors.filter((behavior) => evidenceFor(behavior).includes(selectedExcerpt)) : [];

  function selectView(index) {
    setSelectedCallIndex(index);
    setSelectedBehavior(null);
    setSelectedExcerpt(null);
  }

  function exportTranscript() {
    const transcript = reviewedCalls.map((call) => `CALL ${call.index + 1}: ${call.role}\n\n${call.messages.map((message) => `${message.role === "trainee" ? "Learner" : call.role}: ${message.text}`).join("\n\n")}`).join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([`${scenario?.title || "Scenario Review"}\nAfter Action Review Transcript\n\n${transcript}`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "i2st-review-transcript.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="aarScreen aarRedesign">
      <section className="aarHero">
        <div><span className="aarEyebrow">After Action Review</span><h1>{scenario?.title || "Scenario review"}</h1><p>Reflect on the full scenario, then explore each call and the responses behind its scores.</p></div>
        <span className="aarCompleteBadge">{reviewedCalls.filter((call) => call.messages.length).length} of {stages.length} calls reviewed</span>
      </section>
      <div className="aarViewTabs" role="group" aria-label="Assessment views">
        <button type="button" aria-pressed={!activeCall} onClick={() => selectView(-1)}>Total Scores<span>Across all calls</span></button>
        {reviewedCalls.map((call) => <button type="button" key={call.index} aria-pressed={selectedCallIndex === call.index} onClick={() => selectView(call.index)}>Call {call.index + 1} Scores<span>{call.characterName ? `${call.characterName} · ` : ""}{call.role}</span></button>)}
      </div>
      <div className="aarAssessmentGrid">
      <section className="aarOverview" aria-label="Assessment overview">
        <div className="aarOverallScore"><strong>{overall || "—"}<small>/ 5</small></strong><span>{activeCall ? `Call ${activeCall.index + 1} score` : "Combined score"}</span></div>
        <div><span className="aarEyebrow">{form.selectedKpa || "Assessment"}</span><h2>{hasEvidence ? "A foundation to build on" : "Your review starts with a conversation"}</h2><p>{hasEvidence ? "Review how you acknowledged concerns, asked questions, and guided the conversation. Choose a behavior to explore the interaction." : "Complete a learner response to explore scores and supporting excerpts."}</p><span className="aarSampleLabel">Sample assessment · Scores and evidence links are illustrative</span></div>
      </section>
        <section className="aarCard aarScoreCard" aria-label="Behavior scores">
          <div className="aarCardHeader"><div><span>Assessment</span><h2>{activeCall ? `Call ${activeCall.index + 1} behaviors` : "All-call behavior scores"}</h2></div></div>
          <p className="aarSectionHint">Select a behavior to highlight a supporting response.</p>
          <div className="aarScoreGroups">
            {groups.map((group) => <section key={group.title}><h3>{group.title}</h3>{group.details.map((behavior) => {
              const score = scoreFor(behavior);
              const active = selectedBehavior === behavior || linkedBehaviors.includes(behavior);
              return <button className={`aarBehaviorRow ${active ? "selected" : ""}`} type="button" key={behavior} aria-pressed={active} onClick={() => { setSelectedBehavior(selectedBehavior === behavior ? null : behavior); setSelectedExcerpt(null); }}>
                <span>{behavior}<span className="aarScoreTrack"><span style={{ width: `${(score || 0) * 20}%` }} /></span></span><strong>{score === null ? "—" : score.toFixed(1)}<small>/5</small></strong><ArrowUpRight size={15} />
              </button>;
            })}</section>)}
            {!groups.length && <p className="aarSectionHint">No assessment behaviors were selected for this scenario.</p>}
          </div>
          {hasEvidence && <div className="aarCoachingNote"><span>Try this next time</span><p>After acknowledging a concern, ask one open question and confirm what you heard before moving to next steps.</p></div>}
        </section>
        <section className="aarCard aarEvidenceCard">
          <div className="aarCardHeader"><div><span>Conversation evidence</span><h2>{activeCall ? `Call ${activeCall.index + 1} transcript` : "All conversations"}</h2></div><button className="aarTranscriptExport" type="button" onClick={exportTranscript} disabled={!allMessages.length}><Download size={16} /><span>Export</span></button></div>
          <p className="aarSectionHint">Select a learner response to see its associated behaviors.</p>
          {selectedBehavior && <div className="aarEvidenceFilter"><span>Showing evidence for <strong>{selectedBehavior}</strong></span><button type="button" onClick={() => setSelectedBehavior(null)}>Clear</button></div>}
          {selectedExcerpt && <div className="aarEvidenceFilter"><span><strong>Associated behaviors</strong><br />{linkedBehaviors.join(", ") || "No sample behaviors linked to this response."}</span><button type="button" onClick={() => setSelectedExcerpt(null)}>Clear</button></div>}
          <div className="aarEvidenceTranscript">
            {visibleCalls.map((call) => <section className="aarCallTranscript" key={call.index}><h3>Call {call.index + 1}<span>{call.characterName ? `${call.characterName} · ` : ""}{call.role}</span></h3>{call.messages.map((message, index) => {
              const key = `${call.index}-${index}`;
              const highlighted = selectedExcerpt === key || (selectedBehavior && evidenceFor(selectedBehavior).includes(key));
              const content = <><span>{message.role === "trainee" ? "You" : call.role}<small>Response {index + 1}</small></span><p>{message.text}</p>{highlighted && <em>Linked assessment evidence</em>}</>;
              return message.role === "trainee" ? <button className={`aarEvidenceMessage trainee ${highlighted ? "highlighted" : ""}`} type="button" key={key} aria-pressed={!!highlighted} onClick={() => { setSelectedExcerpt(selectedExcerpt === key ? null : key); setSelectedBehavior(null); }}>{content}</button> : <article className="aarEvidenceMessage" key={key}>{content}</article>;
            })}{!call.messages.length && <p className="aarSectionHint">This call has no conversation to review yet.</p>}</section>)}
          </div>
        </section>
      </div>
      <footer className="aarActions"><button className="secondaryButton" type="button" onClick={onReturnHome}><ArrowLeft size={16} /><span>Return Home</span></button><button className="primaryButton" type="button" onClick={onRunAgain} disabled={busy}><RefreshCcw size={16} /><span>{busy ? "Starting…" : "Practice Again"}</span></button></footer>
    </main>
  );
}
