import OpenAI from 'openai';
import { getEnv, normalizeDiacritics } from './util/env.js';

export type EmbeddingItem = { id: string; text: string; vec?: number[] };

export async function embedBatch(items: EmbeddingItem[], model?: string): Promise<number[][]> {
  const apiKey = getEnv('OPENAI_API_KEY');
  const client = new OpenAI({ apiKey });
  const mdl = model || process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small';
  const input = items.map(i => normalizeDiacritics(i.text));
  const res = await client.embeddings.create({ model: mdl, input });
  return res.data.map(d => d.embedding as number[]);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] || 0; const y = b[i] || 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function topK(query: number[], docs: EmbeddingItem[], k = 5): EmbeddingItem[] {
  const scored = docs
    .filter(d => Array.isArray(d.vec))
    .map(d => ({ d, s: cosineSimilarity(query, d.vec as number[]) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, k)
    .map(x => x.d);
  return scored;
}


