import { useState, type FormEvent } from "react";
import { Logo } from "../components/Logo";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { t } from "../i18n/ar";
import { api, errorText } from "../lib/api";
import { hasArabicLetters } from "../lib/text";
import { useAuthStore } from "../store/auth";

export function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await api("auth:login", { username, password });
    setSubmitting(false);
    if (result.ok) {
      // Always land on the home screen, whatever page the previous user left open.
      window.location.hash = "#/";
      setUser(result.data);
    } else {
      setError(errorText(result));
      setPassword("");
    }
  };

  return (
    <div className="flex h-full bg-bg text-ink">
      <main className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <header className="space-y-1">
            <h1 className="type-h2">{t.login.title}</h1>
            <p className="type-body text-ink-muted">{t.login.subtitle}</p>
          </header>

          {error && <Alert>{error}</Alert>}

          <div className="space-y-4">
            <TextField
              label={t.login.username}
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              dir="ltr"
              className="text-start"
              warning={
                hasArabicLetters(username)
                  ? t.keyboard.usernameLatinOnly
                  : undefined
              }
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
            />
            <PasswordField
              label={t.login.password}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {t.login.submit}
          </Button>
        </form>
      </main>

      {/* Brand panel: the gradient is reserved for large fields like this one. */}
      <aside className="bg-brand-gradient hidden w-[44%] flex-col items-center justify-center gap-8 p-12 text-white lg:flex">
        <Logo variant="white" width={176} />
        <div className="space-y-2 text-center">
          <p className="type-h2">{t.appName}</p>
          <p className="type-body-lg text-navy-50">{t.tagline}</p>
        </div>
      </aside>
    </div>
  );
}
