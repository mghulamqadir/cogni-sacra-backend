import test from 'node:test';
import assert from 'node:assert/strict';
import { courseCreate, lessonInput } from './course.validation.js';

test('video and link lessons require AI grounding context', () => {
  const result = lessonInput.validate({
    title: 'Video',
    order: 0,
    contentType: 'video',
    contentUrl: 'https://example.com/video',
  });
  assert.ok(result.error);
  assert.match(result.error.message, /aiContext/);
});

test('text lessons reject client supplied AI context', () => {
  const result = lessonInput.validate({
    title: 'Text',
    order: 0,
    contentType: 'text',
    contentBody: 'Material',
    aiContext: 'override',
  });
  assert.ok(result.error);
});

test('course price requires a three-letter currency', () => {
  assert.ok(courseCreate.validate({ title: 'Paid', priceAmount: 1000 }).error);
  assert.equal(
    courseCreate.validate({ title: 'Paid', priceAmount: 1000, currency: 'USD' }).error,
    undefined
  );
});
