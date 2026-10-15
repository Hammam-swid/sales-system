import { Logo } from "../components/Logo";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/Field";
import { PasswordField } from "../components/ui/PasswordField";
import { useLoginPage } from "../hooks/useLoginPage";
import { t } from "../i18n";
import { hasArabicLetters } from "../lib/text";

export function LoginPage() {
  const { username, setUsername, password, setPassword, error, submitting, submit } =
    useLoginPage();

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
