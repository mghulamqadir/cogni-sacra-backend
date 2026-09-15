import sanitizeHtml from 'sanitize-html';
import { AppError } from './AppError.js';

export const MAX_RICH_TEXT_BYTES = 100 * 1024;

const allowedTags = [
  'h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr',
  'th', 'td', 'a', 'img',
];

function isCourseImage(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.includes('/cogni-sacra/images/')
    );
  } catch {
    return false;
  }
}

export interface SanitizedRichText {
  html: string;
  plainText: string;
}

export function sanitizeRichText(value: string): SanitizedRichText {
  if (Buffer.byteLength(value, 'utf8') > MAX_RICH_TEXT_BYTES)
    throw new AppError('Text lesson content must not exceed 100 KB', 422, 'CONTENT_TOO_LARGE');

  const html = sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemesByTag: { a: ['https', 'mailto'], img: ['https'] },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !isCourseImage(frame.attribs.src),
  }).trim();

  const plainText = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  if (!plainText && !/<(?:img|table)\b/i.test(html))
    throw new AppError('Text lesson must contain readable content, an image, or a table', 422, 'EMPTY_CONTENT');
  return { html, plainText };
}
