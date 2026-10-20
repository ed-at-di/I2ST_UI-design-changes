import { ArrowLeft, Check, FileSpreadsheet, Moon, PhoneOff, Sun } from "lucide-react";
import logo from "../images/EOCo-logo-black.png";

export function AppHeader({ wizardNavigation, runtimeSession, aarNavigation, themeToggle }) {
  const currentWizardPosition = wizardNavigation
    ? Math.max(0, wizardNavigation.steps.findIndex((item) => item.index === wizardNavigation.step))
    : -1;

  return (
    <header className={`appHeader ${wizardNavigation ? "appHeaderWizard" : ""} ${runtimeSession ? "appHeaderRuntime" : ""} ${aarNavigation ? "appHeaderAar" : ""}`}>
      <div className="appHeaderLeading">
        {runtimeSession ? (
          <div className="appHeaderRuntimeTitle">
            <span>{runtimeSession.stageLabel || "Active Stage"}</span>
            <strong>{runtimeSession.title}</strong>
          </div>
        ) : wizardNavigation ? (
          <button className="appHeaderBack" type="button" onClick={wizardNavigation.onExitToHome} aria-label="Back to Home" title="Back to Home">
            <ArrowLeft size={19} />
          </button>
        ) : aarNavigation ? (
          <button className="appHeaderMark appHeaderHomeLogo" type="button" onClick={aarNavigation.onHome} aria-label="Return Home" title="Return Home">
            <img src={logo} alt="EOCo" />
          </button>
        ) : (
          <span className="appHeaderMark">
            <img src={logo} alt="EOCo" />
          </span>
        )}
      </div>

      {wizardNavigation && (
        <nav className="appHeaderProgress" aria-label="Scenario creation progress">
          <ol className="wizardStepper">
            {wizardNavigation.steps.map((item, position) => {
              const active = item.index === wizardNavigation.step;
              const visited = wizardNavigation.visitedSteps?.has(item.index) ?? position <= currentWizardPosition;
              const done = visited && !active;
              return (
                <li key={item.key} className={`wizardStepperItem ${active ? "active" : ""} ${done ? "done" : ""}`}>
                  <button
                    className="wizardStepperTarget"
                    type="button"
                    disabled={!visited || active}
                    onClick={() => wizardNavigation.onStepChange(item.index)}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className="wizardStepperDot">{done ? <Check size={12} /> : position + 1}</span>
                    <span className="wizardStepperLabel">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {runtimeSession && (
        <div className="appHeaderRuntimeActions">
          <button className="danger" type="button" onClick={runtimeSession.onEndSession}>
            <PhoneOff size={16} />
            <span>End Session</span>
          </button>
        </div>
      )}

      {aarNavigation && (
        <div className="appHeaderRuntimeActions">
          <button type="button" onClick={aarNavigation.onExport} disabled={aarNavigation.exportDisabled}>
            <FileSpreadsheet size={16} />
            <span>Export Scenario</span>
          </button>
        </div>
      )}

      {themeToggle && (
        <button
          className="appHeaderThemeToggle"
          type="button"
          onClick={themeToggle.onToggle}
          aria-label={`Switch to ${themeToggle.theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${themeToggle.theme === "dark" ? "light" : "dark"} mode`}
        >
          {themeToggle.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

    </header>
  );
}
