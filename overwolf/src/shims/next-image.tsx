import type { ImgHTMLAttributes } from "react";

/**
 * `next/image` n'existe pas hors de Next.js : les composants du site qui s'en
 * servent (portrait de champion) reçoivent ici une simple <img>. Les images
 * viennent de Data Dragon, déjà à la bonne taille.
 */
export default function Image({
  unoptimized: _unoptimized,
  priority: _priority,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; priority?: boolean }) {
  return <img loading="lazy" decoding="async" {...props} />;
}
