// RFC 8785 JSON Canonicalization Scheme (JCS) minimal implementation for JSON values
// - Deterministic property ordering (lexicographic, code unit order)
// - No whitespace beyond what JSON.stringify emits
// - Numbers serialized using JS JSON semantics (sufficient for API inputs)

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function canonicalize(value) {
  return Buffer.from(stringifyCanonical(value), 'utf8');
}

function stringifyCanonical(value) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => stringifyCanonical(v));
    return '[' + items.join(',') + ']';
  }
  if (isObject(value)) {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      const v = value[k];
      if (typeof v === 'undefined') continue;
      parts.push(JSON.stringify(k) + ':' + stringifyCanonical(v));
    }
    return '{' + parts.join(',') + '}';
  }
  // Fallback: stringify using JSON semantics
  return JSON.stringify(value);
}

module.exports = { canonicalize, stringifyCanonical };

