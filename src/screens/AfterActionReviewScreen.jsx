import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Download, RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import { KPA_BEHAVIOR_GROUPS } from "../data/scenarioOptions.js";
import { activeScenarioStages } from "../lib/stageHelpers.js";

const SAMPLE_SCORES = [4, 3, 3, 4, 3, 4, 3];
const KPA_COLORS = ["#078da2", "#6558a8", "#d47b34", "#2f846f", "#b2556c"];
const behaviorTitle = (behavior) => typeof behavior === "string" ? behavior : behavior.title;
const behaviorAnchors = (behavior) => typeof behavior === "string" ? [] : behavior.rate_anchors || [];

function ScoreBar({ label, score, color, selected, drillDown, onSelect }) {
  const content = <><span className="aarChartLabel">{label}{drillDown && <small>View behaviors <ChevronRight size={13} /></small>}</span><span className="aarChartTrack" aria-hidden="true"><span style={{ width: `${(score || 0) * 20}%`, backgroundColor: color }} /></span><strong>{score == null ? "—" : score.toFixed(1)}<small>/5</small></strong></>;
  return onSelect ? <button className={`aarChartBar ${selected ? "selected" : ""}`} type="button" onClick={onSelect} aria-pressed={selected}>{content}</button> : <div className="aarChartBar">{content}</div>;
}

export function AfterActionReviewScreen({ scenario, form, messages = [], calls = [], busy, onReturnHome, onRunAgain }) {
  const stages = activeScenarioStages(form);
  const reviewedCalls = calls.length ? calls : [{ index: 0, role: scenario?.role || "Character", messages }];
  const [selectedCallIndex, setSelectedCallIndex] = useState(-1);
  const [selectedKpa, setSelectedKpa] = useState("all");
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState(null);
  const activeCall = reviewedCalls.find((call) => call.index === selectedCallIndex);
  const visibleCalls = activeCall ? [activeCall] : reviewedCalls;
  const allMessages = reviewedCalls.flatMap((call) => call.messages);
  const groups = (KPA_BEHAVIOR_GROUPS[form.selectedKpa] || []).map((group, index) => ({
    ...group,
    color: KPA_COLORS[index % KPA_COLORS.length],
    details: group.details.filter((behavior) => (form.competencyBehaviorFocuses || []).includes(behaviorTitle(behavior))),
  })).filter((group) => group.details.length);
  const behaviors = groups.flatMap((group) => group.details);
  const selectedGroup = groups.find((group) => group.title === selectedKpa);
  const selectedBehaviorData = behaviors.find((behavior) => behaviorTitle(behavior) === selectedBehavior);
  const learnerExcerpts = visibleCalls.flatMap((call) => call.messages.map((message, index) => ({ ...message, key: `${call.index}-${index}` }))).filter((message) => message.role === "trainee");
  const hasEvidence = learnerExcerpts.length > 0;

  const callHasEvidence = (call) => call.messages.some((message) => message.role === "trainee");
  function behaviorScore(behavior, call = activeCall) {
    const index = behaviors.findIndex((item) => behaviorTitle(item) === behaviorTitle(behavior));
    if (call) return callHasEvidence(call) ? SAMPLE_SCORES[(index + call.index) % SAMPLE_SCORES.length] : null;
    const scoredCalls = reviewedCalls.filter(callHasEvidence);
    return scoredCalls.length ? scoredCalls.reduce((sum, item) => sum + SAMPLE_SCORES[(index + item.index) % SAMPLE_SCORES.length], 0) / scoredCalls.length : null;
  }
  function groupScore(group, call = activeCall) {
    const scores = group.details.map((behavior) => behaviorScore(behavior, call)).filter((score) => score != null);
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  }

  const scoredBehaviors = behaviors.map((behavior) => ({ behavior, title: behaviorTitle(behavior), score: behaviorScore(behavior) })).filter((item) => item.score != null);
  const overall = scoredBehaviors.length ? scoredBehaviors.reduce((sum, item) => sum + item.score, 0) / scoredBehaviors.length : null;
  const ranked = [...scoredBehaviors].sort((a, b) => b.score - a.score);
  const strength = ranked[0];
  const opportunity = ranked[ranked.length - 1];
  const evidenceFor = (behavior) => learnerExcerpts.length ? [learnerExcerpts[behaviors.findIndex((item) => behaviorTitle(item) === behavior) % learnerExcerpts.length].key] : [];
  const linkedBehaviors = selectedExcerpt ? behaviors.map(behaviorTitle).filter((behavior) => evidenceFor(behavior).includes(selectedExcerpt)) : [];
  const chartItems = selectedGroup
    ? selectedGroup.details.map((behavior) => ({ label: behaviorTitle(behavior), score: behaviorScore(behavior), color: selectedGroup.color, behavior: behaviorTitle(behavior) }))
    : groups.map((group) => ({ label: group.title, score: groupScore(group), color: group.color, kpa: group.title, drillDown: true }));
  const comparisonSubject = selectedBehavior || selectedGroup?.title || "Overall score";
  const comparisonScores = reviewedCalls.map((call) => {
    let score;
    if (selectedBehaviorData) score = behaviorScore(selectedBehaviorData, call);
    else if (selectedGroup) score = groupScore(selectedGroup, call);
    else {
      const scores = behaviors.map((behavior) => behaviorScore(behavior, call)).filter((value) => value != null);
      score = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
    }
    return { call, score };
  });
  const linePoints = useMemo(() => comparisonScores.map((item, index) => ({ ...item, x: comparisonScores.length === 1 ? 50 : 8 + (index * 84) / (comparisonScores.length - 1), y: item.score == null ? null : 92 - item.score * 16.8 })), [comparisonScores]);
  const polyline = linePoints.filter((point) => point.y != null).map((point) => `${point.x},${point.y}`).join(" ");

  function selectView(index) { setSelectedCallIndex(index); setSelectedBehavior(null); setSelectedExcerpt(null); }
  function selectKpa(title) { setSelectedKpa(title); setSelectedBehavior(null); setSelectedExcerpt(null); }
  function selectBehavior(title) { setSelectedBehavior(selectedBehavior === title ? null : title); setSelectedExcerpt(null); }
  function exportTranscript() {
    const transcript = reviewedCalls.map((call) => `CALL ${call.index + 1}: ${call.role}\n\n${call.messages.map((message) => `${message.role === "trainee" ? "Learner" : call.role}: ${message.text}`).join("\n\n")}`).join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([`${scenario?.title || "Scenario Review"}\nAfter Action Review Transcript\n\n${transcript}`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "i2st-review-transcript.txt"; link.click(); URL.revokeObjectURL(url);
  }

  return <main className="aarScreen aarRedesign">
    <section className="aarHero"><div><span className="aarEyebrow">After Action Review</span><h1>{scenario?.title || "Scenario review"}</h1><p>Reflect on the full scenario, compare calls, and explore the responses behind each score.</p></div><span className="aarCompleteBadge">{reviewedCalls.filter((call) => call.messages.length).length} of {stages.length} calls reviewed</span></section>
    <div className="aarViewTabs" role="group" aria-label="Assessment views">
      <button type="button" aria-pressed={!activeCall} onClick={() => selectView(-1)}>Total Scores<span>Across all calls</span></button>
      {reviewedCalls.map((call) => <button type="button" key={call.index} aria-pressed={selectedCallIndex === call.index} onClick={() => selectView(call.index)}>Call {call.index + 1} Scores<span>{call.characterName ? `${call.characterName} · ` : ""}{call.role}</span></button>)}
    </div>
    <section className="aarOverview" aria-label="Assessment overview">
      <div className="aarOverallScore"><strong>{overall == null ? "—" : overall.toFixed(1)}<small>/ 5</small></strong><span>{activeCall ? `Call ${activeCall.index + 1} score` : "Combined score"}</span></div>
      <div><span className="aarEyebrow">{form.selectedKpa || "Assessment"}</span><h2>{hasEvidence ? "A foundation to build on" : "Your review starts with a conversation"}</h2><p>{hasEvidence ? "Start with the KPA averages, then choose a KPA or behavior to inspect its score, rating description, and supporting evidence." : "Complete a learner response to explore scores and supporting excerpts."}</p></div>
    </section>

    <div className="aarAnalyticsGrid">
      <section className="aarCard aarKpaChartCard" aria-label="Average ratings by KPA">
        <div className="aarCardHeader"><div><span>Assessment</span><h2>{selectedGroup ? `${selectedGroup.title} behaviors` : "Average ratings by KPA"}</h2></div></div>
        <nav className="aarDrillBreadcrumb" aria-label="Assessment drill-down">
          <button type="button" onClick={() => selectKpa("all")} disabled={!selectedGroup}>{selectedGroup && <ArrowLeft size={14} />}All KPAs</button>
          {selectedGroup && <><ChevronRight size={15} aria-hidden="true" /><strong>{selectedGroup.title}</strong><span>Behavior detail</span></>}
        </nav>
        <p className="aarSectionHint">{selectedGroup ? "Select a behavior to view its rating description and supporting evidence." : "Select a KPA below to drill down into its individual behaviors."}</p>
        <div className="aarBarChart" aria-label={`${selectedGroup ? selectedGroup.title : "KPA"} ratings from zero to five`}>
          <div className="aarChartScale" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          {chartItems.map((item) => <ScoreBar key={item.label} {...item} selected={selectedBehavior === item.behavior} onSelect={item.behavior ? () => selectBehavior(item.behavior) : () => selectKpa(item.kpa)} />)}
          {!chartItems.length && <p className="aarSectionHint">No assessment behaviors were selected for this scenario.</p>}
        </div>
        {selectedBehaviorData && <div className="aarRatingDescription"><span>Rating {Math.round(behaviorScore(selectedBehaviorData) || 0)} of 5</span><strong>{selectedBehavior}</strong><p>{behaviorAnchors(selectedBehaviorData).find((anchor) => anchor.rate === Math.round(behaviorScore(selectedBehaviorData) || 0))?.description || "A detailed rating description will appear here when supplied by the connected rating system."}</p></div>}
      </section>

      <section className="aarCard aarComparisonCard" aria-label="Call comparison">
        <div className="aarCardHeader"><div><span>Call comparison</span><h2>{comparisonSubject}</h2></div></div><p className="aarSectionHint">Compare how the selected score changed from one call to the next.</p>
        <div className="aarLineChart"><div className="aarLineYAxis" aria-hidden="true"><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>0</span></div><svg viewBox="0 0 100 108" role="img" aria-label={`${comparisonSubject} by call`} preserveAspectRatio="none">{[8, 24.8, 41.6, 58.4, 75.2, 92].map((y) => <line key={y} x1="5" x2="96" y1={y} y2={y} className="aarGridLine" />)}{polyline && <polyline points={polyline} className="aarTrendLine" />}{linePoints.map((point) => point.y != null && <g key={point.call.index}><circle cx={point.x} cy={point.y} r="2.5" className="aarTrendPoint" /><text x={point.x} y={Math.max(6, point.y - 6)} textAnchor="middle">{point.score.toFixed(1)}</text></g>)}</svg><div className="aarLineXAxis">{linePoints.map((point) => <span key={point.call.index}>Call {point.call.index + 1}</span>)}</div></div>
        <div className="aarRankingGrid"><article><TrendingUp size={18} /><div><span>Strength</span><strong>{strength?.title || "No score yet"}</strong><small>{strength ? `${strength.score.toFixed(1)} / 5` : "Complete a call to view"}</small></div></article><article><TrendingDown size={18} /><div><span>Opportunity</span><strong>{opportunity?.title || "No score yet"}</strong><small>{opportunity ? `${opportunity.score.toFixed(1)} / 5` : "Complete a call to view"}</small></div></article></div>
      </section>
    </div>

    <section className="aarCard aarEvidenceCard">
      <div className="aarCardHeader"><div><span>Conversation evidence</span><h2>{activeCall ? `Call ${activeCall.index + 1} transcript` : "All conversations"}</h2></div><button className="aarTranscriptExport" type="button" onClick={exportTranscript} disabled={!allMessages.length}><Download size={16} /><span>Export</span></button></div><p className="aarSectionHint">Select a learner response to see its associated behaviors. Selecting a behavior above highlights its supporting response here.</p>
      {selectedBehavior && <div className="aarEvidenceFilter"><span>Showing evidence for <strong>{selectedBehavior}</strong></span><button type="button" onClick={() => setSelectedBehavior(null)}>Clear</button></div>}{selectedExcerpt && <div className="aarEvidenceFilter"><span><strong>Associated behaviors</strong><br />{linkedBehaviors.join(", ") || "No sample behaviors linked to this response."}</span><button type="button" onClick={() => setSelectedExcerpt(null)}>Clear</button></div>}
      <div className="aarEvidenceTranscript">{visibleCalls.map((call) => <section className="aarCallTranscript" key={call.index}><h3>Call {call.index + 1}<span>{call.characterName ? `${call.characterName} · ` : ""}{call.role}</span></h3>{call.messages.map((message, index) => { const key = `${call.index}-${index}`; const highlighted = selectedExcerpt === key || (selectedBehavior && evidenceFor(selectedBehavior).includes(key)); const content = <><span>{message.role === "trainee" ? "You" : call.role}<small>Response {index + 1}</small></span><p>{message.text}</p>{highlighted && <em>Linked assessment evidence</em>}</>; return message.role === "trainee" ? <button className={`aarEvidenceMessage trainee ${highlighted ? "highlighted" : ""}`} type="button" key={key} aria-pressed={!!highlighted} onClick={() => { setSelectedExcerpt(selectedExcerpt === key ? null : key); setSelectedBehavior(null); }}>{content}</button> : <article className="aarEvidenceMessage" key={key}>{content}</article>; })}{!call.messages.length && <p className="aarSectionHint">This call has no conversation to review yet.</p>}</section>)}</div>
    </section>
    <footer className="aarActions"><button className="secondaryButton" type="button" onClick={onReturnHome}><ArrowLeft size={16} /><span>Return Home</span></button><button className="primaryButton" type="button" onClick={onRunAgain} disabled={busy}><RefreshCcw size={16} /><span>{busy ? "Starting…" : "Practice Again"}</span></button></footer>
  </main>;
}
