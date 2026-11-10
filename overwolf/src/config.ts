/**
 * L'adresse de Gufo. En développement sur la tour, on vise le serveur du Mac :
 * `VITE_GUFO_URL=http://192.168.1.20:3000 npm run build`.
 */
export const GUFO_URL = (import.meta.env.VITE_GUFO_URL ?? "https://gufo.gg").replace(/\/$/, "");
