const VECTOR_SIZE = 64;

/**
 * Computes a deterministic embedding vector based on input content.
 * Consistent with `memoryEngine.js` for perfect backwards compatibility.
 */
export function createEmbedding(input) {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = String(input).toLowerCase().match(/[a-z0-9_./-]+/g) ?? [];

  tokens.forEach((token, tokenIndex) => {
    let hash = 2166136261;
    for (const char of token) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const index = Math.abs(hash) % VECTOR_SIZE;
    vector[index] += 1 + Math.min(token.length / 24, 1);
    vector[(index + tokenIndex) % VECTOR_SIZE] += 0.25;
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

/**
 * Computes the cosine similarity metric between two vectors.
 */
export function cosineSimilarity(a, b) {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  return dot / ((Math.sqrt(aMagnitude) || 1) * (Math.sqrt(bMagnitude) || 1));
}
