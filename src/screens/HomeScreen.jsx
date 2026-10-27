import { ArrowRight, Library, LogOut, Play, Plus, Trash2 } from "lucide-react";
import { assignedScenariosFromCatalog } from "../data/dummyAssignedScenarioData.js";
import { DUMMY_STATS, DUMMY_USER } from "../data/dummyHomeData.js";

function AssignedCallList({ scenarios, loading, emptyText, onOpenScenario }) {
  if (loading) return <p className="homeEmptyState">Loading scenarios…</p>;
  if (!scenarios.length) return <p className="homeEmptyState">{emptyText}</p>;

  return (
    <div className="assignedCallList">
      {scenarios.map((item) => (
        <article className="assignedCallGroup" key={item.assignmentId || item.scenario_id}>
          <div className="assignedCallGroupHeading">
            <div>
              <h3>{item.title}</h3>
              <p>Assigned by {item.assignedBy} · {item.activityLabel}</p>
            </div>
            <span>1 call</span>
          </div>
          <div className="assignedCallRow">
            <div><span>Call 1</span><strong>{item.role || "Complainant"}</strong></div>
            <button className="assignedLaunchButton" type="button" onClick={() => onOpenScenario(item)}>
              <Play size={14} />
              <span>Launch Call</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HomeScreen({
  scenarios,
  loading,
  onCreateNew,
  onCreateFromExisting,
  onOpenAssignedScenario,
  draft,
  onResumeDraft,
  onDeleteDraft,
  onSignOut,
}) {
  const firstName = DUMMY_USER.name.split(" ")[0];
  const assignedScenarios = assignedScenariosFromCatalog(scenarios);

  return (
    <div className="homeScreen">
      <aside className="homeSidebar">
        <div className="homeUserCard">
          <div className="homeUserIdentity">
            <p className="homeUserWelcome">Welcome back</p>
            <p className="homeUserName">{firstName}</p>
            <div className="homeUserMeta">
              <span className="homeUserRole">{DUMMY_USER.role}</span>
              <span className="homeUserTeam">{DUMMY_USER.team}</span>
            </div>
          </div>
          <div className="homeStatsRow">
            {DUMMY_STATS.map((stat) => (
              <div className="homeStatTile" key={stat.label}>
                <span className="homeStatValue">{stat.value}</span>
                <span className="homeStatLabel">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="homeSignOutSection">
            <button className="homeSignOutButton" type="button" onClick={onSignOut}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="homeMain">
        <section className="homeHero">
          <h1>AI ROLE</h1>
          <p className="homeHeroSubtitle">
            Start with a blank scenario or use an existing scenario as the foundation.
          </p>
          <div className="homeCreateActions">
            <button className="primaryButton homeCreateButton" type="button" onClick={onCreateNew}>
              <Plus size={18} />
              <span>Create New</span>
            </button>
            <button className="secondaryButton homeCreateButton" type="button" onClick={onCreateFromExisting}>
              <Library size={18} />
              <span>Create from Existing</span>
            </button>
          </div>
        </section>

        {draft && (
          <section className="homeCurrentSection">
            <h2>Current Scenario</h2>
            <div className="currentCard" onClick={onResumeDraft}>
              <div className="currentCardInfo">
                <span className="currentCardBadge">{draft.stepLabel}</span>
                <h3>{draft.title}</h3>
                <span className="currentCardRole">{draft.role}</span>
              </div>
              <div className="currentCardActions">
                <button
                  className="currentCardDelete"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteDraft();
                  }}
                  aria-label="Delete current scenario"
                  title="Delete current scenario"
                >
                  <Trash2 size={16} />
                </button>
                <span className="currentCardResume">
                  <ArrowRight size={18} />
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="homeScenarios assignedScenarios">
          <div className="homeSectionHeading">
            <div>
              <h2>Assigned Calls</h2>
              <p>Upcoming character calls grouped by scenario.</p>
            </div>
            <span>{assignedScenarios.length} assigned</span>
          </div>
          <AssignedCallList
            scenarios={assignedScenarios}
            loading={loading}
            emptyText="No scenarios are currently assigned."
            onOpenScenario={onOpenAssignedScenario}
          />
        </section>
      </div>
    </div>
  );
}
