export interface ExtractedMetadata {
  contentType?: string | null;
  sizeBytes?: number;
  additional?: Record<string, unknown>;
}

export interface MetadataInput {
  contentType?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export function buildMetadata(input: MetadataInput, fallbackSize?: number): ExtractedMetadata {
  const result: ExtractedMetadata = {};

  if (input.contentType) {
    result.contentType = input.contentType.trim();
  }

  if (typeof input.sizeBytes === "number" && input.sizeBytes >= 0) {
    result.sizeBytes = input.sizeBytes;
  } else if (typeof fallbackSize === "number" && fallbackSize >= 0) {
    result.sizeBytes = fallbackSize;
  }

  if (input.metadata && typeof input.metadata === "object") {
    result.additional = sanitizeMetadata(input.metadata);
  }

  return result;
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key !== "string" || key.length > 200) {
      continue;
    }
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      cleaned[key] = value;
      continue;
    }
    if (typeof value === "string" && value.length <= 2000) {
      cleaned[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      cleaned[key] = value.slice(0, 20);
      continue;
    }
    if (typeof value === "object") {
      cleaned[key] = Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 20));
      continue;
    }
  }
  return cleaned;
}
