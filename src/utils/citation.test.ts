import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCitation } from './citation';

test('formatCitation generates correct APA format', () => {
  const citation = formatCitation({
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A., et al.',
    publicationYear: 2017,
    url: 'https://arxiv.org/abs/1706.03762',
  }, 'apa');

  assert.equal(
    citation,
    'Vaswani, A., et al. (2017). Attention Is All You Need. Retrieved from https://arxiv.org/abs/1706.03762'
  );
});

test('formatCitation generates correct BibTeX format', () => {
  const citation = formatCitation({
    title: 'Quantum Supremacy Using a Programmable Superconducting Processor',
    authors: 'Arute, F., et al.',
    publicationYear: 2019,
  }, 'bibtex');

  assert.ok(citation.startsWith('@article{arute2019,'));
  assert.ok(citation.includes('author = {Arute, F., et al.}'));
  assert.ok(citation.includes('year = {2019}'));
});
