import NextLink from "next/link";
import type { ComponentProps } from "react";

import { NAV_TRANSITION } from "@/lib/view-transitions";

/**
 * Le lien de l'application : celui de Next.js, qui annonce en plus une
 * navigation « voulue ». C'est ce type qui déclenche la transition entre deux
 * pages (voir `src/lib/view-transitions.ts`).
 *
 * À utiliser partout à la place de `next/link` (la règle de lint y veille).
 */
export function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink transitionTypes={NAV_TRANSITION} {...props} />;
}
