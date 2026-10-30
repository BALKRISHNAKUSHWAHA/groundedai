/**
 * Smart Document Processor & Semantic Chunker for ResearchHub AI
 * Splits research text into overlapping semantic chunks with sentence preservation.
 */

export interface ChunkOptions {
  maxChunkSizeTokens?: number; // Approximate tokens (1 token ≈ 4 characters / 0.75 words)
  overlapTokens?: number;
}

export interface DocumentChunkResult {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

/**
 * Estimates token count based on standard English lexical heuristic (avg 4 chars/token).
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

/**
 * Splits text into paragraphs and sentences, then bundles them into chunks
 * respecting maxChunkSize and overlap.
 */
export function chunkDocumentText(
  rawContent: string,
  options: ChunkOptions = {}
): DocumentChunkResult[] {
  const maxTokens = options.maxChunkSizeTokens ?? 1000;
  const overlapTokens = options.overlapTokens ?? 200;

  if (!rawContent || rawContent.trim().length === 0) {
    return [];
  }

  const cleanText = rawContent
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // If entire text fits inside one chunk
  const totalTokens = estimateTokenCount(cleanText);
  if (totalTokens <= maxTokens) {
    return [
      {
        chunkIndex: 0,
        content: cleanText,
        tokenCount: totalTokens,
      },
    ];
  }

  // Split into sentences using regex while keeping abbreviations somewhat intact
  const sentences: string[] = [];
  const paragraphs = cleanText.split('\n\n');

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    // Split sentences inside paragraph
    const matches = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        if (m.trim().length > 0) {
          sentences.push(m.trim());
        }
      }
    } else {
      sentences.push(trimmedPara);
    }
  }

  const chunks: DocumentChunkResult[] = [];
  let currentSentences: string[] = [];
  let currentTokenCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokenCount(sentence);

    // If single sentence is larger than max, split by words
    if (sentenceTokens > maxTokens) {
      if (currentSentences.length > 0) {
        const chunkText = currentSentences.join(' ');
        chunks.push({
          chunkIndex: chunks.length,
          content: chunkText,
          tokenCount: estimateTokenCount(chunkText),
        });
        currentSentences = [];
        currentTokenCount = 0;
      }

      // Word split
      const words = sentence.split(/\s+/);
      let subChunkWords: string[] = [];
      let subTokens = 0;
      for (const w of words) {
        const wTokens = estimateTokenCount(w) + 1;
        if (subTokens + wTokens > maxTokens && subChunkWords.length > 0) {
          const subText = subChunkWords.join(' ');
          chunks.push({
            chunkIndex: chunks.length,
            content: subText,
            tokenCount: estimateTokenCount(subText),
          });
          // keep some words for overlap
          const overlapWords = Math.floor(overlapTokens * 0.75);
          subChunkWords = subChunkWords.slice(-Math.min(overlapWords, subChunkWords.length / 2));
          subTokens = estimateTokenCount(subChunkWords.join(' '));
        }
        subChunkWords.push(w);
        subTokens += wTokens;
      }
      if (subChunkWords.length > 0) {
        const subText = subChunkWords.join(' ');
        chunks.push({
          chunkIndex: chunks.length,
          content: subText,
          tokenCount: estimateTokenCount(subText),
        });
      }
      continue;
    }

    if (currentTokenCount + sentenceTokens > maxTokens && currentSentences.length > 0) {
      const chunkText = currentSentences.join(' ');
      chunks.push({
        chunkIndex: chunks.length,
        content: chunkText,
        tokenCount: estimateTokenCount(chunkText),
      });

      // Compute sentences to retain for overlap
      let retainedSentences: string[] = [];
      let retainedTokens = 0;
      for (let j = currentSentences.length - 1; j >= 0; j--) {
        const s = currentSentences[j];
        const sTokens = estimateTokenCount(s);
        if (retainedTokens + sTokens <= overlapTokens) {
          retainedSentences.unshift(s);
          retainedTokens += sTokens;
        } else {
          break;
        }
      }

      currentSentences = retainedSentences;
      currentTokenCount = retainedTokens;
    }

    currentSentences.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  if (currentSentences.length > 0) {
    const chunkText = currentSentences.join(' ');
    chunks.push({
      chunkIndex: chunks.length,
      content: chunkText,
      tokenCount: estimateTokenCount(chunkText),
    });
  }

  return chunks;
}
