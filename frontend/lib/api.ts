/**
 * Resolves the backend base URL.
 * The Next.js dev server is reached via ingress at the public preview URL,
 * which also routes /api → backend. So we just hit the same origin.
 */
export const apiUrl = (path: string): string => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  return `${base}${path}`;
};
