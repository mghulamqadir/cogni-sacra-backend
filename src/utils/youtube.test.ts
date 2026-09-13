import test from 'node:test';
import assert from 'node:assert/strict';
import { isYouTubeUrl, parseYouTubeUrl } from './youtube.js';

test('normalizes supported YouTube URL formats', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=12',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ]) {
    assert.deepEqual(parseYouTubeUrl(url), {
      videoId: 'dQw4w9WgXcQ',
      contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
  }
});

test('does not classify invalid or non-YouTube URLs as YouTube videos', () => {
  assert.equal(parseYouTubeUrl('https://example.com/watch?v=dQw4w9WgXcQ'), undefined);
  assert.equal(parseYouTubeUrl('https://youtube.com/watch?v=too-short'), undefined);
});

test('recognizes YouTube hosts even when their video URL is invalid', () => {
  assert.equal(isYouTubeUrl('https://youtube.com/watch?v=too-short'), true);
  assert.equal(isYouTubeUrl('https://youtu.be/not-a-video'), true);
  assert.equal(isYouTubeUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'), false);
});
