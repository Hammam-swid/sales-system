import { Hammer } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { t } from '../i18n'

export function ComingSoonPage() {
  return (
    <Card className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <Hammer aria-hidden className="size-10 text-accent-fill" />
      <h2 className="type-h3">{t.comingSoon.title}</h2>
      <p className="type-body text-ink-muted">{t.comingSoon.body}</p>
    </Card>
  )
}
