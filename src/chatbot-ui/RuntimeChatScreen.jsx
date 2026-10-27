import { useMemo, useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  Send,
} from "lucide-react";

// SVG adaptation of the score-driven flower used by PyPlutchik:
// https://github.com/alfonsosemeraro/pyplutchik
const PLUTCHIK_EMOTIONS = [
  { name: "Joy", color: "#f2ce00" },
  { name: "Trust", color: "#6b8e23" },
  { name: "Fear", color: "#228b22" },
  { name: "Surprise", color: "#74c7e8" },
  { name: "Sadness", color: "#1e90ff" },
  { name: "Disgust", color: "#6a5acd" },
  { name: "Anger", color: "#ff4b2e" },
  { name: "Anticipation", color: "#ff8c00" },
];

function polarPoint(radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 160 + radius * Math.cos(radians),
    y: 160 + radius * Math.sin(radians),
  };
}

function petalPath(score, angle) {
  const baseRadius = 24;
  const tipRadius = baseRadius + score * 106;
  const controlRadius = baseRadius + (tipRadius - baseRadius) * 0.56;
  const baseLeft = polarPoint(baseRadius, angle - 13);
  const baseRight = polarPoint(baseRadius, angle + 13);
  const controlLeft = polarPoint(controlRadius, angle - 20);
  const controlRight = polarPoint(controlRadius, angle + 20);
  const tip = polarPoint(tipRadius, angle);

  return [
    `M ${baseLeft.x} ${baseLeft.y}`,
    `Q ${controlLeft.x} ${controlLeft.y} ${tip.x} ${tip.y}`,
    `Q ${controlRight.x} ${controlRight.y} ${baseRight.x} ${baseRight.y}`,
    "Z",
  ].join(" ");
}

export function RuntimeChatScreen({
  busy,
  error,
  formatLatency,
  input,
  messages,
  scrollRef,
  sendTurn,
  session,
  setInput,
  stages = [],
  activeStageIndex = 0,
  onSelectStage,
  completedCalls = [],
  onFinishCall,
}) {
  const [showDetails, setShowDetails] = useState(true);
  const [listening, setListening] = useState(false);
  const traineeTurns = messages.filter((item) => item.role === "trainee").length;
  const latestAvatar = [...messages].reverse().find((item) => item.role === "avatar");
  const activeStage = stages[activeStageIndex];
  const activeRole = activeStage?.chatbotRole === "Other" ? activeStage.chatbotRoleOther : activeStage?.chatbotRole;
  const nextStage = stages[activeStageIndex + 1];
  const nextRole = nextStage?.chatbotRole === "Other" ? nextStage.chatbotRoleOther : nextStage?.chatbotRole;
  const isLastCall = activeStageIndex >= stages.length - 1;
  const panelClassName = [
    "runtimeExperience",
    showDetails ? "detailsOpen" : "detailsClosed",
  ].join(" ");

  const emotionScores = useMemo(() => {
    const progress = Math.min(1, traineeTurns / 4);
    const scores = [
      0.12 + progress * 0.18,
      0.28 + progress * 0.55,
      0.78 - progress * 0.42,
      0.34 - progress * 0.12,
      0.55 - progress * 0.2,
      0.18 - progress * 0.08,
      0.36 - progress * 0.18,
      0.5 - progress * 0.1,
    ];
    return PLUTCHIK_EMOTIONS.map((emotion, index) => ({ ...emotion, score: scores[index] }));
  }, [traineeTurns]);
  const currentEmotion = emotionScores.reduce((strongest, emotion) => (emotion.score > strongest.score ? emotion : strongest));

  function toggleListening() {
    const nextListening = !listening;
    setListening(nextListening);
    if (nextListening && !input.trim()) {
      setInput("I hear you. Can you tell me more about what happened and how it affected your work?");
    }
  }

  function sendOnEnter(event) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <main className={`runtimeScreen ${error ? "hasError" : ""}`}>
      {error && (
        <div className="runtimeError" role="alert">
          {error}
        </div>
      )}

      <section className={panelClassName}>
        <div className="runtimeAvatarFocus">
          <div className="runtimeAvatarMain">
            <div id="unity-avatar-stage" className="runtimeAvatarStage" aria-label="Avatar display" />

            <div className="runtimeLiveResponse">
              <p>{latestAvatar?.text || "The avatar response will appear here when the roleplay begins."}</p>
            </div>

            <footer className="runtimeComposerShell">
              <div className="runtimeSessionStrip">
                <span>Turn {Math.max(1, traineeTurns + 1)}</span>
                <button className="runtimeCallAdvance" type="button" onClick={onFinishCall} disabled={busy}>
                  <CheckCircle2 size={16} />
                  <span>{isLastCall ? "Finish call and view assessment" : `Finish call and continue to ${nextRole || `Character ${activeStageIndex + 2}`}`}</span>
                </button>
              </div>
              <form className="runtimeComposer" onSubmit={sendTurn}>
                <div className="runtimeDraftField">
                  <div className="runtimeDraftLabelRow">
                    <label htmlFor="runtime-response">
                      {listening ? "Listening — edit the transcript before sending" : "Your response"}
                    </label>
                    <span>Enter to send · Shift+Enter for a new line</span>
                  </div>
                  <textarea
                    id="runtime-response"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={sendOnEnter}
                    placeholder={listening ? "Listening… recognized speech will appear here." : "Type your trainee response or use the microphone…"}
                    disabled={busy || !session?.session_id}
                    rows={2}
                  />
                  <button
                    className={listening ? "voiceButton active" : "voiceButton"}
                    type="button"
                    onClick={toggleListening}
                    disabled={busy || !session?.session_id}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop voice capture" : "Start voice capture"}
                    title={listening ? "Stop voice capture" : "Start voice capture"}
                  >
                    {listening ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>
                  <button className="sendButton" type="submit" disabled={busy || !input.trim() || !session?.session_id} aria-label="Send">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </footer>
          </div>

          <nav className="runtimeStageSwitcher" aria-label="Call schedule">
              <div className="runtimeCalendarHeading">
                <strong>Scenario calls</strong>
              </div>
              <div className="runtimeCalendarTimeline">
              {stages.map((stage, index) => {
                const role = stage.chatbotRole === "Other" ? stage.chatbotRoleOther : stage.chatbotRole;
                const active = index === activeStageIndex;
                return (
                  <div className="runtimeCalendarSlot" key={stage.id || index}>
                    <button
                      className={`${active ? "active" : ""} ${completedCalls.includes(index) ? "complete" : ""}`.trim()}
                      type="button"
                      aria-current={active ? "step" : undefined}
                      onClick={() => index === activeStageIndex && onSelectStage?.(index)}
                      disabled={busy || index !== activeStageIndex}
                    >
                      <span>Call {index + 1}</span>
                      <small>{role || "Character"}</small>
                      <em>{active ? "Current call" : completedCalls.includes(index) ? "Completed" : "Not started"}</em>
                    </button>
                  </div>
                );
              })}
              </div>
          </nav>
        </div>

        <aside className="runtimeDetailsDrawer" aria-label="Call details">
          <button
            className="runtimeDetailsToggle"
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            aria-expanded={showDetails}
            aria-controls="runtime-details-content"
          >
            {showDetails ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            <span>Details</span>
          </button>

          {showDetails && <div className="runtimeDetailsContent" id="runtime-details-content">
            <section className="runtimeDetailsMind" aria-label="Avatar State of Mind">
              <div className="runtimePanelHeader">
                <div>
                  <p>State of Mind</p>
                  <span>Emotion wheel</span>
                </div>
              </div>
              <div className="emotionWheelShell">
                <svg className="emotionWheel" viewBox="0 0 320 320" role="img" aria-labelledby="emotion-wheel-title emotion-wheel-description">
                  <title id="emotion-wheel-title">Plutchik's wheel of emotions</title>
                  <desc id="emotion-wheel-description">Eight Plutchik emotion petals sized by the avatar's current emotion scores. The strongest emotion is {currentEmotion.name} at {Math.round(currentEmotion.score * 100)} percent.</desc>
                  {[0.2, 0.4, 0.6, 0.8, 1].map((value) => (
                    <circle className="emotionGuideRing" cx="160" cy="160" r={24 + value * 106} key={value} />
                  ))}
                  {emotionScores.map((emotion, index) => {
                    const spokeEnd = polarPoint(134, -90 + index * 45);
                    return <line className="emotionGuideSpoke" x1="160" y1="160" x2={spokeEnd.x} y2={spokeEnd.y} key={`${emotion.name}-spoke`} />;
                  })}
                  {emotionScores.map((emotion, index) => {
                    const angle = -90 + index * 45;
                    const labelPoint = polarPoint(148, angle);
                    const anchor = labelPoint.x > 170 ? "start" : labelPoint.x < 150 ? "end" : "middle";
                    const isActive = emotion.name === currentEmotion.name;
                    return (
                      <g className={isActive ? "emotionPetal active" : "emotionPetal"} style={{ color: emotion.color }} key={emotion.name}>
                        <path d={petalPath(emotion.score, angle)} fill={emotion.color} />
                        <text className="emotionPetalLabel" x={labelPoint.x} y={labelPoint.y - 4} textAnchor={anchor}>
                          <tspan x={labelPoint.x}>{emotion.name}</tspan>
                          <tspan className="emotionPetalScore" x={labelPoint.x} dy="11">{Math.round(emotion.score * 100)}%</tspan>
                        </text>
                      </g>
                    );
                  })}
                  <circle className="emotionWheelCenter" cx="160" cy="160" r="22" />
                </svg>
              </div>
            </section>

            <section className="runtimeDetailsTranscript" aria-label="Conversation transcript">
              <div className="runtimePanelHeader">
                <div>
                  <p>Transcript</p>
                  <span>{messages.length} messages</span>
                </div>
                <MessageSquareText size={18} />
              </div>
              <div className="runtimeTranscript" aria-live="polite">
                {messages.map((message, index) => (
                  <article className={`runtimeMessageRow ${message.role}`} key={`${message.role}-${index}`}>
                    <div className={`runtimeBubble ${message.role}`}>
                      <span>
                        {message.role === "avatar" ? activeRole || "Character" : "Trainee"}
                      </span>
                      <p>{message.text}</p>
                    </div>
                  </article>
                ))}
                {busy && <div className="runtimeTypingLine" aria-label="Avatar is responding"><span /><span /><span /></div>}
                <div ref={scrollRef} />
              </div>
            </section>
          </div>}
        </aside>
      </section>
    </main>
  );
}
