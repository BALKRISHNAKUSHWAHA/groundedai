/**
 * Citation generation utility supporting APA 7th, MLA 9th, Chicago 17th, and BibTeX.
 */

export interface SourceCitationMeta {
  title: string;
  authors?: string;
  publicationYear?: number;
  sourceType?: string;
  url?: string;
  doi?: string;
  journal?: string;
}

export function formatCitation(source: SourceCitationMeta, style: 'apa' | 'mla' | 'chicago' | 'bibtex'): string {
  const title = (source.title || 'Untitled Document').trim();
  const authors = (source.authors || 'Unknown Author').trim();
  const year = source.publicationYear || new Date().getFullYear();
  const url = source.url || '';

  switch (style) {
    case 'apa': {
      // APA 7th: Author, A. A. (Year). Title of work. Publisher/URL.
      const urlPart = url ? ` Retrieved from ${url}` : '';
      return `${authors} (${year}). ${title}.${urlPart}`;
    }
    case 'mla': {
      // MLA 9th: Author. "Title of Source." Year. URL.
      const urlPart = url ? ` ${url}.` : '';
      return `${authors}. "${title}." ${year}.${urlPart}`;
    }
    case 'chicago': {
      // Chicago 17th: Author. Year. "Title of Source." URL.
      const urlPart = url ? ` ${url}.` : '';
      return `${authors}. ${year}. "${title}."${urlPart}`;
    }
    case 'bibtex': {
      // BibTeX entry
      const cleanKey = (authors.split(/[\s,]+/)[0] || 'source')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') + year;
      return `@article{${cleanKey},
  author = {${authors}},
  title = {${title}},
  year = {${year}}${url ? `,\n  url = {${url}}` : ''}
}`;
    }
    default:
      return `${authors} (${year}). ${title}.`;
  }
}
