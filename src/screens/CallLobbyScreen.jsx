import { ArrowLeft, CalendarDays, Check, Clock3, UserRound, Video } from "lucide-react";

function roleForCharacter(character) {
  return character?.chatbotRole === "Other" ? character.chatbotRoleOther : character?.chatbotRole;
}

export function CallLobbyScreen({ scenario, characters = [], completedCalls = [], busy, onJoin, onBack, backLabel = "Back to scenarios" }) {
  const title = scenario?.title || scenario?.preview?.scenarioTitle || "Scenario call";
  const nextCallIndex = characters.findIndex((_, index) => !completedCalls.includes(index));

  return (
    <main className="callLobbyScreen">
      <button className="callLobbyBack" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>{backLabel}</span>
      </button>

      <section className="callLobbyHero">
        <div className="callLobbyDateTile" aria-hidden="true">
          <span>Today</span>
          <strong>{new Date().getDate()}</strong>
        </div>
        <div>
          <span className="callLobbyEyebrow"><CalendarDays size={16} /> Scenario calls</span>
          <h1>{title}</h1>
          <p>Complete each character conversation in order. Finished calls stay visible in the schedule.</p>
        </div>
      </section>

      <section className="callAgenda" aria-label="Scenario call schedule">
        {characters.map((character, index) => {
          const role = roleForCharacter(character) || (index === 0 ? "Complainant" : `Character ${index + 1}`);
          const isComplete = completedCalls.includes(index);
          const isCurrent = index === nextCallIndex;
          const status = isComplete ? "complete" : isCurrent ? "current" : "upcoming";
          return (
            <article className={`callAgendaItem ${status}`} key={character.id || index}>
              <div className="callAgendaTime">
                {isComplete ? <Check size={16} /> : <Clock3 size={16} />}
                <span>{isComplete ? "Completed" : isCurrent ? "Ready now" : `After call ${index}`}</span>
              </div>
              <div className="callAgendaIdentity">
                <span className="callAgendaAvatar">{isComplete ? <Check size={22} /> : <UserRound size={22} />}</span>
                <div>
                  <small>Call {index + 1} of {characters.length}</small>
                  <h2>{role}</h2>
                  <p>{isComplete ? "Conversation completed." : isCurrent ? "This conversation is ready to begin." : "This call unlocks after the previous conversation."}</p>
                </div>
              </div>
              {isCurrent ? (
                <button className="callJoinButton" type="button" onClick={() => onJoin(index)} disabled={busy}>
                  <Video size={18} /><span>{busy ? "Joining…" : `${index === 0 ? "Join" : "Continue to"} ${role}`}</span>
                </button>
              ) : <span className={`callUpcomingLabel ${isComplete ? "complete" : ""}`}>{isComplete ? "Done" : "Upcoming"}</span>}
            </article>
          );
        })}
      </section>
    </main>
  );
}
