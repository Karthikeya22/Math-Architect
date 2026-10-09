import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { dbService } from '../services/dbService';
import { createGuestOnServer, loginUserOnServer, registerUserOnServer } from '../services/userService';
import { User } from '../types';
import { ArrowRight, UserRound } from 'lucide-react';
import BrandMark from './BrandMark';
import { MotionDiagram } from './motion-diagrams';

interface Props {
  onLogin: (user: User) => void;
}

const POINTS = [
  'Pin a Florida B.E.S.T. standard from the coherence map',
  'Generate an aligned quiz with classroom-ready figures',
  'Diagnose gaps and open short remedial slides',
];

const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const reduceMotion = useReducedMotion();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);
  const formBusy = busy && !guestBusy;
  const formId = useId();
  const usernameId = `${formId}-username`;
  const fullNameId = `${formId}-fullname`;
  const errorId = `${formId}-error`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Enter a username to continue.');
      return;
    }

    setBusy(true);
    try {
      if (isLoginMode) {
        const remote = await loginUserOnServer(username.trim());
        if (remote.ok === false) {
          if (remote.status === 503) {
            try {
              const user = dbService.login(username.trim());
              onLogin(user);
            } catch (err: any) {
              setError(err?.message || 'No account found with that username.');
            }
          } else {
            setError(remote.error);
          }
          return;
        }
        dbService.setSessionFromUser(remote.user);
        onLogin(remote.user);
        return;
      }

      if (!fullName.trim()) {
        setError('Enter your full name to create an account.');
        return;
      }

      const reg = await registerUserOnServer(username.trim(), fullName.trim());
      if (reg.ok === false) {
        if (reg.status === 503) {
          try {
            const user = dbService.register(username.trim(), fullName.trim());
            onLogin(user);
          } catch (err: any) {
            setError(err?.message || 'Registration failed.');
          }
        } else {
          setError(reg.error);
        }
        return;
      }
      dbService.setSessionFromUser(reg.user);
      onLogin(reg.user);
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setBusy(true);
    setGuestBusy(true);
    try {
      const guest = await createGuestOnServer();
      if (guest.ok === false) {
        if (guest.status === 503) {
          const fallback: User = {
            id: `guest_local_${Date.now()}`,
            username: 'Guest',
            fullName: 'Guest',
            createdAt: Date.now(),
            isGuest: true,
          };
          dbService.setSessionFromUser(fallback);
          onLogin(fallback);
        } else {
          setError(guest.error);
        }
        return;
      }
      dbService.setSessionFromUser(guest.user);
      onLogin(guest.user);
    } catch (err: any) {
      setError(err?.message || 'Could not start a guest session.');
    } finally {
      setBusy(false);
      setGuestBusy(false);
    }
  };

  return (
    <div className="auth-shell relative">
      <div className="auth-grain" aria-hidden="true" />
      <a href="#auth-main" className="auth-skip-link">
        Skip to sign in
      </a>

      <div className="auth-layout relative z-[1]">
        <aside className="auth-aside" aria-label="Product overview">
          <div className="auth-brand-row">
            <BrandMark />
          </div>

          <div className="auth-aside-copy">
            <h1 className="auth-title text-balance">
              Build assessments that match Florida math standards
            </h1>
            <ul className="auth-points">
              {POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <MotionDiagram
            name="Atlas"
            width={420}
            plate="#eef0ff"
            followCursor
            desktopOnly
            className="auth-figure"
          />
        </aside>

        <main id="auth-main" className="auth-main">
          <motion.section
            className="auth-card"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            aria-labelledby="auth-heading"
          >
            <div className="auth-card-brand">
              <BrandMark size="compact" />
            </div>
            <header className="auth-card-header">
              <h2 id="auth-heading" className="auth-card-title">
                {isLoginMode ? 'Sign in' : 'Create account'}
              </h2>
              <p className="auth-card-subtitle">
                {isLoginMode
                  ? 'Use your username, or continue as guest on this device.'
                  : 'Save quiz and remediation progress when the server is connected.'}
              </p>
            </header>

            <div className="auth-mode-toggle" role="tablist" aria-label="Account mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLoginMode}
                onClick={() => {
                  setIsLoginMode(true);
                  setError('');
                }}
                className={`auth-mode-btn ${isLoginMode ? 'is-active' : ''}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLoginMode}
                onClick={() => {
                  setIsLoginMode(false);
                  setError('');
                }}
                className={`auth-mode-btn ${!isLoginMode ? 'is-active' : ''}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor={usernameId} className="auth-label">
                  Username
                </label>
                <input
                  id={usernameId}
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="app-input auth-input"
                  placeholder="e.g. mgarcia"
                  spellCheck={false}
                  autoCapitalize="none"
                  disabled={busy}
                  aria-invalid={Boolean(error) && !username.trim()}
                  aria-describedby={error ? errorId : undefined}
                />
              </div>

              {!isLoginMode && (
                <div className="auth-field animate-slide-down">
                  <label htmlFor={fullNameId} className="auth-label">
                    Full name
                  </label>
                  <input
                    id={fullNameId}
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="app-input auth-input"
                    placeholder="e.g. Maya Garcia"
                    disabled={busy}
                  />
                </div>
              )}

              {error && (
                <div id={errorId} className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy} className="auth-submit app-btn-primary">
                <span>
                  {formBusy
                    ? isLoginMode
                      ? 'Signing in…'
                      : 'Creating account…'
                    : isLoginMode
                      ? 'Sign in'
                      : 'Create account'}
                </span>
                {!formBusy && <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
              </button>
            </form>

            <div className="auth-divider" role="separator" aria-label="or">
              <span>or</span>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handleGuest}
              className="auth-guest app-btn-secondary"
            >
              <UserRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              {guestBusy ? 'Starting guest session…' : 'Continue as guest'}
            </button>

            <p className="auth-footnote">
              Guest sessions stay on this device. Registered accounts sync when connected.
            </p>
          </motion.section>
        </main>
      </div>
    </div>
  );
};

export default AuthScreen;
