export function normalizeUrl(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().toLowerCase();
  }
}

export function hashText(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

export function sanitizeCell(value: unknown): string {
  const text = String(value ?? "").replace(/<[^>]*>/g, "").trim();
  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }
  return text;
}

export function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toDomain(value: string): string {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
