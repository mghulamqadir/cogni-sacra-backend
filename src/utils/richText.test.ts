import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRichText } from './richText.js';

test('keeps approved rich text and produces AI plain text', () => {
  const result = sanitizeRichText(
    '<h1>Cells</h1><p><strong>Study</strong> cells.</p><ul><li>Nucleus</li></ul>'
  );
  assert.match(result.html, /<h1>Cells<\/h1>/);
  assert.match(result.html, /<strong>Study<\/strong>/);
  assert.equal(result.plainText, 'Cells Study cells. Nucleus');
});

test('removes unsafe markup and rejects content left empty', () => {
  assert.throws(
    () => sanitizeRichText('<script>alert(1)</script><iframe src="https://example.com"></iframe>'),
    { code: 'EMPTY_CONTENT' }
  );
});

test('keeps only approved Cloudinary course images', () => {
  const allowed = sanitizeRichText(
    '<img src="https://res.cloudinary.com/demo/image/upload/cogni-sacra/images/cell.webp" alt="Cell">'
  );
  assert.match(allowed.html, /<img/);
  assert.throws(() => sanitizeRichText('<img src="https://example.com/cell.png" alt="Cell">'));
});
