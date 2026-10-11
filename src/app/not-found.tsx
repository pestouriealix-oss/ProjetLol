import { MiniMap } from "@/components/map/mini-map";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";

export default function NotFound() {
  return (
    <main
      id="contenu"
      className="mx-auto grid min-h-dvh max-w-4xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <div className="flex flex-col items-start gap-4">
        <p className="display text-2xl text-accent">404</p>
        <h1 className="display text-5xl text-ink">{t.common.notFoundTitle}</h1>
        <p className="text-lg text-ink-muted">{t.common.notFoundBody}</p>
        <Button asChild variant="secondary" className="mt-3">
          <Link href="/dashboard">{t.common.backHome}</Link>
        </Button>
      </div>
      {/* Hors de la carte : un signal perdu dans un coin où personne ne joue. */}
      <MiniMap ping={[86, 90]} className="max-md:hidden" />
    </main>
  );
}
