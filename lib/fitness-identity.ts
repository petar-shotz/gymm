// These headers are supplied by the Sites authentication boundary, never by the UI.
export function fitnessIdentity(headers: Headers): string | null {
  const id = headers.get('oai-authenticated-user-id')?.trim();
  if (id) return id;
  const email = headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return email ? `email:${email}` : 'local-user';
}
