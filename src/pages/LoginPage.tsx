import { useState, type FormEvent } from "react";
import { authApi, authStorage } from "../api";

interface LoginPageProps {
  onLoggedIn: () => void;
}

export default function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await authApi.login({
        email: email.trim(),
        password,
      });

      setPassword("");
      onLoggedIn();
    } catch (err) {
      authStorage.clearToken();

      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div
      className="app-shell d-flex align-items-center justify-content-center p-3"
      style={{
        background:
          "linear-gradient(135deg, #171a35 0%, #34345f 55%, #7257e8 100%)",
      }}
    >
      <div
        className="panel login-card w-100"
        style={{ maxWidth: 430, padding: 36 }}
      >
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="brand-mark">E</div>
          <div>
            <div className="brand-name">
              Employee<span>Hub</span>
            </div>
            <div className="muted-note">Management portal</div>
          </div>
        </div>

        <div className="eyebrow">WELCOME BACK</div>
        <h1 className="mt-2 mb-2">
          Sign in to <span>your account</span>
        </h1>

        <p className="muted-note mb-4">
          Enter your credentials to access the employee management system.
        </p>

        {loginError && (
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}

        <form onSubmit={login}>
          <div className="mb-3">
            <label htmlFor="loginEmail">Email address</label>
            <input
              id="loginEmail"
              type="email"
              className="form-control"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              type="password"
              className="form-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="btn btn-primary w-100"
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
