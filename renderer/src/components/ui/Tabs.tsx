import { cn } from '../../lib/cn'

interface TabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'type-label -mb-px h-11 border-b-2 px-5 transition-colors duration-[120ms] ease-brand',
              selected
                ? 'border-primary font-bold text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
