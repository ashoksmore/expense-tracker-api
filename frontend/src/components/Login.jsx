import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export const DEMO_USERNAME = "ash";
export const DEMO_PASSWORD = "12345";

function Login({ onLogin, themeMode, setThemeMode }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (username.trim() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      setError("Invalid username or password.");
      return;
    }

    onLogin(DEMO_USERNAME);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__toolbar">
          <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />
        </div>

        <header className="login-card__header">
          <h1>Expense Tracker</h1>
          <p className="app-subtitle">Sign in to manage your spending</p>
        </header>

        <div className="login-demo-credentials" role="note">
          <p className="login-demo-credentials__title">Demo credentials</p>
          <p>
            Username: <strong>{DEMO_USERNAME}</strong>
          </p>
          <p>
            Password: <strong>{DEMO_PASSWORD}</strong>
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
