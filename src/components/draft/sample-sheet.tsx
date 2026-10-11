import { t } from "@/i18n/fr";

const s = t.sample;

/**
 * Fiche de draft d'exemple, affichée sur l'écran de connexion : c'est ce que le
 * produit fabrique, donc c'est ce qu'on montre en premier.
 * Contenu statique. La vraie fiche (étape 3) reprendra cette mise en forme.
 */
export function SampleSheet() {
  return (
    <figure className="w-full max-w-md">
      <figcaption className="mb-3 text-sm text-ink-faint">{s.label}</figcaption>
      <div className="rounded-panel border border-line-strong bg-surface">
        <header className="border-b border-line px-5 py-4">
          <p className="font-display text-xl font-semibold text-ink">{s.title}</p>
          <p className="mt-0.5 text-sm text-ink-muted">{s.versus}</p>
        </header>

        <section className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-medium text-ink-muted">{s.winConditions}</h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="font-medium text-accent">{s.ours}</dt>
            <dd className="text-ink">{s.oursText}</dd>
            <dt className="font-medium text-ink-muted">{s.theirs}</dt>
            <dd className="text-ink">{s.theirsText}</dd>
          </dl>
        </section>

        <section className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-medium text-ink-muted">{s.powerCurve}</h3>
          <PowerCurve />
        </section>

        <section className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-medium text-ink-muted">{s.plans}</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              [s.planA, s.planADetail],
              [s.planB, s.planBDetail],
            ].map(([title, detail]) => (
              <li key={title} className="rounded-control bg-raised px-3 py-2.5">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="px-5 py-4">
          <h3 className="text-sm font-medium text-ink-muted">{s.threat}</h3>
          <p className="mt-1 text-sm text-ink">{s.threatText}</p>
        </section>
      </div>
    </figure>
  );
}

/** Deux courbes qui se croisent : qui est fort, et quand. */
function PowerCurve() {
  return (
    <div className="mt-3">
      <svg viewBox="0 0 320 96" role="img" aria-label={s.powerCurveAlt} className="w-full">
        {/* Repère de bascule */}
        <line
          x1="192"
          y1="4"
          x2="192"
          y2="92"
          className="stroke-line-strong"
          strokeDasharray="3 4"
        />
        {/* Eux : faibles au début, dominants à la fin */}
        <path
          d="M4 80 C 90 78, 150 62, 192 44 S 280 14, 316 10"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-ink-faint"
        />
        {/* Vous : forts tôt, puis en retrait */}
        <path
          d="M4 30 C 60 12, 120 16, 192 44 S 280 70, 316 74"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-accent"
        />
        <circle cx="192" cy="44" r="4" className="fill-canvas stroke-ink" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-ink-faint">
        <span>{s.earlyAxis}</span>
        <span className="text-ink-muted">{s.crossover}</span>
        <span>{s.lateAxis}</span>
      </div>
    </div>
  );
}
