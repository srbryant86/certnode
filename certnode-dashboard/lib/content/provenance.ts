export interface ProvenanceInput {
  creator?: string;
  creatorType?: "human" | "ai" | "hybrid" | string;
  aiModel?: string;
  creationTimestamp?: string;
  sourceAttribution?: string;
  notes?: string;
  [key: string]: unknown;
}

export function normalizeProvenance(input?: ProvenanceInput | null): Record<string, unknown> | null {
  if (!input) return null;
  const normalized: Record<string, unknown> = {};

  if (input.creator) normalized.creator = String(input.creator).slice(0, 200);
  if (input.creatorType) normalized.creatorType = String(input.creatorType).slice(0, 50).toLowerCase();
  if (input.aiModel) normalized.aiModel = String(input.aiModel).slice(0, 200);

  if (input.creationTimestamp) {
    const ts = new Date(input.creationTimestamp);
    if (!Number.isNaN(ts.getTime())) normalized.creationTimestamp = ts.toISOString();
  }

  if (input.sourceAttribution) normalized.sourceAttribution = String(input.sourceAttribution).slice(0, 500);
  if (input.notes) normalized.notes = String(input.notes).slice(0, 1000);

  const extras = Object.entries(input).filter(([key]) => ![
    "creator",
    "creatorType",
    "aiModel",
    "creationTimestamp",
    "sourceAttribution",
    "notes",
  ].includes(key));

  if (extras.length > 0) {
    normalized.additional = Object.fromEntries(extras.slice(0, 20));
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}
