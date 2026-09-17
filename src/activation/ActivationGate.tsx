import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type ActivationStatus = Awaited<ReturnType<
  typeof window.settingForge.activation.getStatus
>>;

interface ActivationGateProps {
  children: ReactNode;
}

function mayEnterOffline(status: ActivationStatus): boolean {
  return status.state === 'offline' && status.previouslyAuthorized;
}

export function ActivationGate({ children }: ActivationGateProps) {
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [email, setEmail] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    let active = true;
    void window.settingForge.activation.validate().then((result) => {
      if (!active) return;
      setStatus(result);
      setEmail(result.email ?? '');
      setDeviceName(result.deviceName);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
  if (!status || !mayEnterOffline(status)) {
    setShowOfflineNotice(false);
    return;
  }

  setShowOfflineNotice(true);

  const timeoutId = window.setTimeout(() => {
    setShowOfflineNotice(false);
  }, 8000);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [status]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !deviceName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await window.settingForge.activation.register({
        email: email.trim(),
        deviceName: deviceName.trim(),
      });
      setStatus(result);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    if (submitting) return;
    setSubmitting(true);
    try {
      setStatus(await window.settingForge.activation.validate());
    } finally {
      setSubmitting(false);
    }
  }

  if (status?.state === 'authorized' || (status && mayEnterOffline(status))) {
    return (
      <>
        {children}
        {mayEnterOffline(status) && showOfflineNotice && (
          <div className="activation-offline-notice" role="status">
            Authorization server unavailable. Working offline.
          </div>
        )}
      </>
    );
  }

  const unregistered = status?.state === 'unregistered';
  const canRegister = unregistered || status?.state === 'denied' ||
    status?.state === 'invalid-request' || status?.state === 'error';

  return (
    <main className="activation-screen">
      <section className="activation-card" aria-labelledby="activation-title">
        <h1 id="activation-title">SettingForge</h1>

        {!status ? (
          <p>Checking authorization...</p>
        ) : (
          <>
            <h2>Tester Activation</h2>
            <p>
              Enter the email address approved for SettingForge testing.
            </p>

            {status.message && (
              <div className="activation-error" role="alert">
                {status.message}
              </div>
            )}

            {status.state === 'offline' && !status.previouslyAuthorized && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRetry()}
              >
                {submitting ? 'Retrying...' : 'Retry Connection'}
              </button>
            )}

            {canRegister && (
              <form onSubmit={(event) => void handleRegister(event)}>
                <label>
                  Approved email
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                  />
                </label>

                <label>
                  Device name
                  <input
                    type="text"
                    maxLength={100}
                    value={deviceName}
                    onChange={(event) => setDeviceName(event.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!email.trim() || !deviceName.trim() || submitting}
                >
                  {submitting ? 'Activating...' : 'Activate SettingForge'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
