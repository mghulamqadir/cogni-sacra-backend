# Frontend Course Integration Plan

This is the implementation contract for the course frontend. It is aligned with the API mounted below `/api/v1` in this repository. Do not use Supabase, mock courses, or endpoints mentioned only in older product documents as a course data source.

## 1. Integration rules

- The backend is the source of truth for ownership, visibility, publishing, enrollment, lesson completion, and course progress.
- Never send `institutionId`, `instructorId`, `createdBy`, `status`, `visibility`, or `publishedAt` from the browser. The server derives or controls them.
- Send `Authorization: Bearer <token>` on protected requests.
- Every API response is `{ success, message, data, code?, requestId? }`. Show `message` to users; retain `requestId` in client error reporting.
- Use IDs returned by the API. Never generate replacement IDs for persisted courses, modules, lessons, or assessments.
- Do not replace an API failure with mock data. Keep the last known server data and show a retryable error state.

## 2. Shared API client and types

Create one request utility, for example `src/lib/api.ts`. It must prefix paths with the configured API base URL plus `/api/v1`, attach the current JWT, and parse the standard envelope.

- Use JSON request bodies by default.
- For `FormData`, do not set `Content-Type`; the browser supplies the multipart boundary.
- On `401`, clear the expired session and redirect to sign-in.
- Return structured errors for `403`, `404`, `409`, `422`, and `429`; do not turn them into a generic error.
- Disable the initiating UI control while a mutation is pending to prevent duplicate requests.

Mirror backend values in frontend types:

```ts
type CourseStatus = 'draft' | 'published' | 'archived';
type CourseVisibility = 'private' | 'public_requested' | 'public';
type EnrollmentMode = 'assigned_only' | 'self_enroll' | 'assigned_and_self_enroll';
type LessonContentType = 'text' | 'video' | 'link' | 'youtube';

type LessonResource = {
  _id?: string;
  name: string;
  fileUrl: string;
  fileKey?: string;
  mimeType?: string;
  size?: number;
};

type Lesson = {
  _id: string;
  moduleId: string;
  courseId: string;
  title: string;
  order: number;
  contentType: LessonContentType;
  contentBody?: string;
  contentUrl?: string;
  mediaKey?: string;
  videoId?: string;
  embedUrl?: string;
  aiContext?: string;
  resources: LessonResource[];
};
```

The browser submits only `text`, `video`, or `link` as a lesson input type. The backend returns a valid submitted YouTube link as `youtube`, with `videoId` and `embedUrl`. A link whose host is YouTube or `youtu.be` must contain a supported valid video ID; otherwise the API returns `422 INVALID_YOUTUBE_URL` and the builder must keep the draft open for correction.

## 3. Public catalog and course detail

### Public catalog

Use:

```http
GET /courses/public?page=1&limit=20&search=keyword
```

Implement controlled search, server pagination, and loading, empty, and error states.

- Debounce search approximately 300 ms and reset the page to `1` when search changes.
- Keep `page`, `limit`, and `search` in the browser URL so the catalog is shareable.
- Request only `limit` values from `1` to `100`.
- Render title, description, thumbnail, and paid/free state from the response.
- Navigate to a course detail route with only the course ID. Do not treat a card object as the detail page source of truth.

### Course detail

Use:

```http
GET /courses/:id
```

Public published courses are visible anonymously. Unauthorized private courses return `404`; show a not-found page and do not reveal private course information.

This endpoint currently returns metadata only, not the full module/lesson hierarchy. The browser must not recreate an outline from cached builder state.

## 4. Instructor "My Courses" dashboard

Show this dashboard only to `instructor` and `independent_instructor` users. Its only list source is:

```http
GET /instructor/courses?page=1&limit=20&search=biology&status=draft&visibility=private
```

Supported query parameters:

- `page`: defaults to `1` and must be at least `1`.
- `limit`: defaults to `20` and may be at most `100`.
- `search`: optional title/description search.
- `status`: optional `draft`, `published`, or `archived` filter.
- `visibility`: optional `private`, `public_requested`, or `public` filter.

Keep every filter in the browser URL. Reset to page `1` whenever search, status, or visibility changes. Debounce search input by approximately 300 ms and cancel obsolete list requests when filters change.

Each returned card includes only metadata and aggregate counts:

```ts
type InstructorCourseCard = {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'public_requested' | 'public';
  enrollmentMode: EnrollmentMode;
  priceAmount?: number;
  currency?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
};
```

Render course status, visibility, material counts, learner count, updated date, price/free state, and actions. Do not expect modules, lessons, learner identities, or ownership fields from this endpoint.

Dashboard behavior:

- Show an empty-state action that opens the course builder when `courses` is empty.
- Render server pagination from `total`, `page`, and `totalPages`; `totalPages: 0` is a valid empty result.
- Use course ID to navigate to edit, analytics, or preview pages.
- Never filter a shared cached course list in the browser for ownership. The server has already applied the authenticated instructor ownership rule.
- Learners, institution administrators, and platform administrators must not see this page; if it is reached, handle API `403` as access denied.

## 5. Learner enrollment and progress

### Enrollment

For a free eligible course:

```http
POST /courses/:id/enroll
```

Do not send a request body. On success, invalidate the learner-course query and change the action to the enrolled state.

For a paid public course, independent learners use:

```http
POST /courses/:id/checkout
```

Redirect to the returned Stripe Checkout URL. Payment-webhook processing creates enrollment; after return, refetch learner courses rather than assuming payment means enrollment already exists.

Learner dashboard source:

```http
GET /learner/courses
```

### Open and complete lessons

```http
GET  /courses/:courseId/lessons/:lessonId
POST /lessons/:lessonId/complete
POST /lessons/:lessonId/video-progress
GET  /learner/courses/:courseId/progress
```

Opening a lesson requires enrollment. On `403 ENROLLMENT_REQUIRED`, show the relevant enrollment state instead of a broken player.

For text and normal links, complete using:

```http
POST /lessons/:lessonId/complete
```

For YouTube lessons only:

```http
POST /lessons/:lessonId/video-progress
Content-Type: application/json

{
  "watchedSeconds": 540,
  "durationSeconds": 600
}
```

The backend accepts completion only at 90% watched. Both completion operations are idempotent. Replace local progress with the returned enrollment data, and use `GET /learner/courses/:courseId/progress` for refreshes. Never compute final course completion only from client state.

## 6. Lesson rendering

| Returned type | Renderer | Completion |
| --- | --- | --- |
| `text` | Render server-sanitized HTML from `contentBody`. | `POST /lessons/:id/complete` |
| `video` | Render `contentUrl` in the application video player. | `POST /lessons/:id/complete` |
| `link` | Render an external-link card. Open in a new tab with `noopener noreferrer`. | `POST /lessons/:id/complete` |
| `youtube` | Render only server-provided `embedUrl` in a YouTube iframe. | `POST /lessons/:id/video-progress` |

Use a resource's `fileUrl` for downloads. Display server-provided name, MIME type, and size; do not construct Cloudinary URLs from `fileKey`.

### Rich text lessons

Text lessons store a sanitized HTML string in `contentBody`. The editor may create headings (`h1`–`h4`), paragraphs, bold/italic/underline/strikethrough, lists, blockquotes, code blocks, tables, `https`/`mailto` links, and Cloudinary images. Submitted HTML is limited to 100 KB.

Use a rich-text editor such as TipTap and render only the server-returned HTML. Upload images through `POST /media/image` before inserting the returned Cloudinary URL in the editor. The backend removes scripts, iframes, inline styles/event handlers, unsafe URLs, data URLs, external image URLs, and unapproved tags. Display `EMPTY_CONTENT` or `CONTENT_TOO_LARGE` without discarding the tutor's draft.

### YouTube player contract

Use the YouTube IFrame Player API, not a plain iframe without player events.

1. Initialize the player from `embedUrl`, never from the tutor’s raw URL.
2. Use player state or a local timer to inspect `getCurrentTime()` and `getDuration()`. This must remain browser-only; do not poll the backend.
3. When watched time reaches 90%, send exactly one `video-progress` request and set a local `completionSent` flag.
4. On `document.visibilitychange`, pause when the document becomes hidden. Do not count or report hidden playback.
5. If the API returns `VIDEO_INCOMPLETE`, continue local tracking and retry only after the threshold is reached again.
6. Do not call the regular `/complete` route for YouTube lessons; it returns `VIDEO_PROGRESS_REQUIRED`.

### YouTube playlists

A YouTube playlist URL is not a lesson and is rejected as `INVALID_YOUTUBE_URL`. The course builder must create one lesson for each video instead:

```text
Module: Cell Biology
  Lesson 1: https://www.youtube.com/watch?v=VIDEO_A
  Lesson 2: https://www.youtube.com/watch?v=VIDEO_B
  Lesson 3: https://www.youtube.com/watch?v=VIDEO_C
```

Each submitted video is independently validated and normalized by the backend, rendered in its own iframe through `embedUrl`, and completed independently at 90% watched. Do not embed a playlist in one lesson, because it cannot provide reliable per-video lesson progress.

If playlist-to-lessons import is added later, it must expand the playlist into separate draft lessons for tutor review before the course is saved; it must not create one playlist lesson.

## 7. Tutor course builder

Show course authoring only to `platform_admin`, `instructor`, and `independent_instructor`. Institution administrators manage invitations and publication approval; they do not create course content.

Maintain a local unsaved draft consisting of course metadata, modules, lessons, uploaded-material references, and resource references.

Validate before sending:

- Course title: 2–160 characters; module and lesson title: 1–160.
- `priceAmount` and a three-letter `currency` are supplied together or both omitted.
- Text lesson: `contentBody` required; do not send `contentUrl` or `aiContext`.
- Video lesson: `contentUrl`, `mediaKey`, and `aiContext` required.
- Link lesson: `contentUrl` and `aiContext` required. Use this for YouTube URLs too; accept only a valid YouTube watch, short, embed, live, or `youtu.be` video URL when the host is YouTube.
- Video/link `aiContext` is a transcript, summary, or explanation used by the AI Tutor.
- Module order is unique within a course; lesson order is unique within its module.

### Upload materials first

Upload endpoints return a URL and storage key. Put only those references in builder state.

| Material | Endpoint | Browser behavior |
| --- | --- | --- |
| Thumbnail image | `POST /media/image` | Multipart field name: `image`; store returned URL as `thumbnailUrl`. |
| Small video | `POST /media/video` | Multipart field name: `video`; store returned URL/key. |
| Large video | `POST /media/video/upload-signature`, direct Cloudinary upload, `POST /media/video/complete` | Store verified canonical URL/key. |
| Lesson document | `POST /media/document` | Multipart field name: `document`; attach returned URL/key as a resource. |

Do not put local object URLs, data URLs, or raw `File` objects into a course request. Disable final save until selected uploads are completed or removed.

### Create full course draft

```http
POST /courses/bulk
```

```json
{
  "title": "Introduction to Biology",
  "description": "A complete biology course",
  "enrollmentMode": "self_enroll",
  "modules": [
    {
      "title": "Cell Structure",
      "order": 0,
      "lessons": [
        {
          "title": "Cell overview",
          "order": 0,
          "contentType": "text",
          "contentBody": "Cells are the basic units of life.",
          "resources": []
        },
        {
          "title": "Mitochondria video",
          "order": 1,
          "contentType": "link",
          "contentUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "aiContext": "This lesson explains the function of mitochondria.",
          "resources": []
        }
      ]
    }
  ]
}
```

This request creates every course record or none. On failure, preserve the entire local draft. Render a server validation message beside the relevant input; map paths such as `modules[0].lessons[1].aiContext` to that field.

Cloudinary assets uploaded before a rejected bulk request can remain orphaned. Keep their returned references in the local draft so a user can correct and retry without re-uploading.

### Edit existing content

```http
PATCH  /courses/:id
POST   /courses/:courseId/modules
PATCH  /modules/:id
DELETE /modules/:id?confirm=true
POST   /modules/:moduleId/lessons
PATCH  /lessons/:id
DELETE /lessons/:id
```

Use every mutation response to replace local state. Confirm module deletion because it deletes lessons. The bulk endpoint creates a new course only; do not use it to update an existing course.

## 8. Course edit, preview, and analytics

### Edit course

Course editing is available to a course owner with the course-builder endpoints above. Use the course ID in the route, for example `/instructor/courses/:courseId/edit`; never derive ownership from the browser.

- Load editable course metadata with `GET /courses/:id`. This endpoint is also the source of truth after refresh.
- Update metadata with `PATCH /courses/:id`. Send only editable metadata such as title, description, thumbnail, enrollment mode, and price/currency; never send ownership, institution, status, visibility, or publication fields.
- Add, update, and delete modules and lessons with the individual builder endpoints in section 7. Replace the relevant local draft entity from each successful mutation response and invalidate the owned-course query.
- For an unsaved course, keep the whole builder draft locally and create it once through `POST /courses/bulk`. Do not call the bulk endpoint for an existing course.
- On `403` or `404`, leave the edit screen as access denied/not found and do not show cached private details. On `409` and `422`, retain the unsaved draft and display the server error beside the relevant control.

### Preview course

There is **no dedicated preview API** today. `GET /courses/:id` returns metadata only, so it cannot safely power a module outline, lesson navigation, or a full player preview.

Until ordered content is available, the preview route may show only course metadata (title, description, thumbnail, price/free state, status, and visibility) from `GET /courses/:id`. Do not construct lesson content from a cached builder draft or instructor list card.

Before implementing an actual lesson-player preview, add and use:

```http
GET /courses/:id/content
```

Its response must be caller-accessible ordered modules, lessons, resources, and assessments. An owner should be able to read drafts for preview; a learner must receive only enrolled, accessible content; learner assessment payloads must omit answer keys and `plainTextForAI`. Once available, the preview page should use the same renderers as the learner player, while keeping completion/progress mutations disabled.

### Course analytics

Course analytics is implemented for `instructor` and `independent_instructor` users:

```http
GET /instructor/courses/:id/analytics
```

The server restricts this endpoint to the course owner and returns `404` for a course the caller does not own. The frontend must not include an instructor ID or institution ID in the request.

The current response data is:

```ts
type CourseAnalytics = {
  enrollmentCount: number;
  averageProgressPercent: number;
  completionRatePercent: number;
  averageAssessmentScorePercent: number;
  lessonCompletionBreakdown: Array<{
    lessonId: string;
    title: string;
    completionCount: number;
  }>;
};
```

Render summary cards for enrollment, average progress, completion rate, and average assessment score, then a per-lesson completion table or chart. Treat `0` as a valid metric, show an empty analytics state when there are no enrollments, and avoid calculating alternate metrics in the browser.

Independent instructors may additionally load gross sales for paid courses:

```http
GET /independent-instructor/courses/:id/earnings
```

This returns paid-enrollment count, course currency, gross sales amount, and currently zeroed refund values; label it **gross sales**, not payout or net revenue.

Invalidate or refetch course analytics after enrollment, lesson completion, video progress, and assessment submission. Invalidate it after content mutations only if the analytics UI is open or includes the affected lesson breakdown.

## 9. Publishing workflow

| Action | Endpoint | Frontend rule |
| --- | --- | --- |
| Publish | `POST /courses/:id/publish` | Enable only after a module and lesson exist; handle `COURSE_INCOMPLETE`. |
| Archive | `POST /courses/:id/archive` | Require explicit confirmation. |
| Request public publication | `POST /courses/:id/request-publication` | Institution course moves to `public_requested`; institution-less course becomes public. |
| Approve publication | `POST /courses/:id/approve-publication` | Display only for institution admins in their own institution. |

Independent-instructor courses become public when published. Institutional instructors cannot approve their own public requests.

## 10. Quizzes in a course

Create a quiz after a lesson by attaching its `lessonId`:

```http
POST /courses/:courseId/assessments
```

```json
{
  "title": "Cell Structure Quiz",
  "lessonId": "LESSON_ID",
  "passingScorePercent": 70,
  "maxAttempts": 2,
  "questions": [
    {
      "text": "What is the powerhouse of the cell?",
      "options": ["Nucleus", "Mitochondria", "Ribosome", "Membrane"],
      "correctOptionIndex": 1
    }
  ]
}
```

Learner calls:

```http
GET  /assessments/:id
POST /assessments/:id/submit
GET  /assessments/:id/results/me
```

Submit selected option indexes only. Never expose or cache `correctOptionIndex` in learner UI.

## 11. Required backend dependency: ordered course content

The current API has no endpoint returning ordered modules, lessons, resources, and assessments. The frontend cannot build a reliable full outline, next/previous navigation, or quiz-in-sequence experience without it.

Add before implementing the full player:

```http
GET /courses/:id/content
```

It must return only caller-accessible content, ordered by `module.order` and `lesson.order`, with assessments grouped after their linked `lessonId`. Learner responses must omit assessment correct answers and `plainTextForAI`.

Until this exists, only open known lesson IDs with `GET /courses/:courseId/lessons/:lessonId`; do not construct an outline from stale builder data.

## 12. Cache, errors, and tests

Use a query cache such as TanStack Query or equivalent.

| Successful mutation | Invalidate/refetch |
| --- | --- |
| Enroll | learner-course list, course detail, course progress |
| Create/update/publish/archive/request publication | instructor My Courses list and owned course detail |
| Complete lesson/video progress | course progress, learner-course list, course content when available |
| Create/update/delete module or lesson | owned course detail/content |
| Publish/archive/request/approve | public catalog and owned course detail |
| Submit assessment | assessment result and learner summary if displayed |

Error behavior:

- `401`: clear session and redirect to sign-in.
- `403`: show access-denied or enrollment-required UI; do not auto-retry.
- `404`: show not found and do not reveal private information.
- `409`: preserve form values and offer refresh/retry.
- `422`: show field validation errors and retain all unsaved builder inputs.
- `429`: show retry guidance and temporarily disable the relevant action.

Release acceptance checks:

1. Public search, pagination, and detail view work after refresh.
2. Instructor My Courses returns only owned cards, correctly filters search/status/visibility, paginates, and refreshes after a course mutation.
3. Free enrollment persists after refresh; paid enrollment waits for backend confirmation.
4. Cross-institution/private-course access is denied without information leakage.
5. Tutor creates a bulk course with text, uploaded video, YouTube link, and document resources.
6. Invalid nested bulk data creates no course and highlights the failing field.
7. A YouTube lesson stays incomplete below 90%, completes at 90%, and duplicate completion is safe.
8. Hiding the tab pauses YouTube and sends no progress call.
9. Text/link completion uses `/complete`; YouTube completion uses `/video-progress`.
10. Learners never receive quiz answer keys and receive server-calculated results.

## 13. Delivery order

1. Shared API client, authentication handling, standard types, and API-error UI.
2. Public catalog and course metadata detail page.
3. Instructor My Courses dashboard, including filters and server pagination.
4. Enrollment, learner dashboard, and persisted progress display.
5. Tutor media upload components and draft-first bulk course builder.
6. Individual content editing, metadata-only preview, analytics, and publishing lifecycle.
7. YouTube player with one 90% completion request.
8. Assessment authoring, attempt, and result UI.
9. Full ordered player, true owner preview, and in-sequence quiz UI after `GET /courses/:id/content` is delivered.
