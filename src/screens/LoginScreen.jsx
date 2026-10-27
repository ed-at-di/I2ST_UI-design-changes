import { ArrowRight } from "lucide-react";
import logo from "../images/IIST-logo.png";
import loginArtwork from "../images/login-background-art.jpg";
import loginArtworkDark from "../images/login-background-art-dark.jpg";

export function LoginScreen({ onLogin, theme }) {
  function submitLogin(event) {
    event.preventDefault();
    onLogin();
  }

  return (
    <main className="loginScreen">
      <section className="loginPanel" aria-labelledby="login-heading">
        <div className="loginBrand">
          <img src={logo} alt="I2ST" />
        </div>

        <div className="loginFormShell">
          <span className="loginEyebrow">
            <i aria-hidden="true" />
            I2ST Training Platform
          </span>
          <h1 id="login-heading">Welcome back</h1>
          <p className="loginIntro">Sign in to build, review, and run interactive training scenarios.</p>

          <form className="loginForm" onSubmit={submitLogin}>
            <label className="loginField">
              <span>Email address</span>
              <input type="email" defaultValue="jordan.blake@eoco.training" autoComplete="username" />
            </label>
            <label className="loginField">
              <span>Password</span>
              <input type="password" defaultValue="training-demo" autoComplete="current-password" />
            </label>

            <div className="loginOptions">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <button type="button">Forgot password?</button>
            </div>

            <button className="loginSubmit" type="submit">
              <span>Sign in</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="loginPrototypeNote">Prototype access — the sign-in button will take you directly into the experience.</p>
        </div>

        <p className="loginFooter">Interactive scenario training and evaluation</p>
      </section>

      <section className="loginArtwork" aria-hidden="true">
        <img src={theme === "dark" ? loginArtworkDark : loginArtwork} alt="" />
      </section>
    </main>
  );
}
