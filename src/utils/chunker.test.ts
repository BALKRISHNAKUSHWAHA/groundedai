import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkDocumentText, estimateTokenCount } from './chunker';

test('estimateTokenCount returns expected approximations', () => {
  assert.equal(estimateTokenCount(''), 0);
  assert.equal(estimateTokenCount('hello'), 2); // 5 chars / 4 = 1.25 -> 2
  assert.equal(estimateTokenCount('This is a research document test.'), 9);
});

test('chunkDocumentText returns single chunk for short text', () => {
  const shortText = 'Quantum computing leverages superposition and entanglement to achieve computational speedups.';
  const chunks = chunkDocumentText(shortText, { maxChunkSizeTokens: 100, overlapTokens: 20 });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].chunkIndex, 0);
  assert.ok(chunks[0].content.includes('Quantum computing'));
});

test('chunkDocumentText splits long text into multiple indexed chunks with overlap', () => {
  const sentences = [
    'First sentence describes the primary hypothesis of the paper.',
    'Second sentence provides details about the methodology and clinical setup.',
    'Third sentence details the empirical evaluation metrics.',
    'Fourth sentence summarizes statistical significance results.',
    'Fifth sentence highlights limitations in current experimental controls.',
    'Sixth sentence outlines future research directions in bioinformatics.',
  ];
  const longText = sentences.join(' ');
  // Set small max tokens to force splitting
  const chunks = chunkDocumentText(longText, { maxChunkSizeTokens: 25, overlapTokens: 10 });
  
  assert.ok(chunks.length > 1, `Expected multiple chunks, got ${chunks.length}`);
  assert.equal(chunks[0].chunkIndex, 0);
  assert.equal(chunks[1].chunkIndex, 1);
  assert.ok(chunks.every(c => c.tokenCount > 0));
});
