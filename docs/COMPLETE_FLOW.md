# CogniSacra Complete API Flow

This guide describes how to configure, run, and test the implemented CogniSacra MVP from Swagger UI. The API prefix is `/api/v1`.

## 1. Actors and access model

| Role                  | Institution required | Main responsibilities                                                                                                                                 |
| --------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform_admin`      | No                   | Create institutions, approve them, invite their first administrator, create platform courses and platform library resources                           |
| `institution_admin`   | Yes                  | Invite instructors and learners, approve institution courses for the public catalog, view institution analytics, manage institution library resources |
| `instructor`          | Yes                  | Build and publish owned courses, create assessments, assign courses, view course analytics                                                            |
| `learner`             | Yes                  | Access assigned or eligible self-enrolled institutional courses                                                                                       |
| `independent_learner` | No                   | Register publicly and enroll in free or paid public courses                                                                                           |
| `independent_instructor` | No                | Register publicly, create institution-less public courses, self-publish complete courses, and view owned-course analytics and gross sales          |

Course enrollment modes:

- `assigned_only`: only an institution administrator or owning instructor can enroll institutional learners through assignment.
- `self_enroll`: eligible learners can enroll themselves; assignment remains available to authorized staff for institutional courses.
- `assigned_and_self_enroll`: both assignment and self-enrollment are available at the same time.

### Course creation permissions

| User | Can create a course? | Course ownership |
|---|---:|---|
| Platform administrator | Yes | Platform-owned course with no institution |
| Institution administrator | No | Manages institution courses created by instructors and approves public publication |
| Institutional instructor | Yes | Institution-owned course in the instructor's institution |
| Independent instructor | Yes | Institution-less public course owned by that instructor |
| Institutional learner | No | Can only access eligible courses |
| Independent learner | No | Can only enroll in public courses |

Institution administrators manage the institution's members, resources, and publication approvals. Course content is created by an institutional instructor. This separation prevents administrative users from accidentally becoming course owners and keeps course-building permissions clear.

Institutional users cannot register themselves. They enter through a single-use invitation link and choose their own password. `POST /auth/register` creates an `independent_learner` account and accepts only `name`, `email`, `password`, and `confirmPassword`. After email verification and login, the user calls `POST /account/onboarding` with `accountType: learner` or `accountType: instructor`; the server then maps the account to `independent_learner` or `independent_instructor`. New Google accounts are also created as `independent_learner`; Google login does not accept `accountType`, and existing Google accounts retain their stored role.

## 2. Environment and startup

Use a MongoDB replica set because invitation acceptance, assessment submission, and destructive course operations use transactions.

Add the following values to `.env` in addition to the existing MongoDB, JWT, Google, Brevo, Cloudinary, and Stripe settings:

```env
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-5-nano
AI_TUTOR_MAX_CONTEXT_TOKENS=6000
AI_TUTOR_MAX_QUESTION_CHARS=2000
AI_TUTOR_RATE_LIMIT_PER_HOUR=30

FEATURE_VIRTUAL_LIBRARY=true
FEATURE_PAID_ENROLLMENT=true
LOG_LEVEL=info

PLATFORM_ADMIN_NAME=Platform Admin
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=ChangeThisStrongPassword
```

Install, build, provision the initial administrator, and start the API:

```bash
npm install
npm run build
npm run seed:admin
npm run dev
```

For a database containing users from the old `user/admin` model, run the migration once before normal use:

```bash
npm run migrate:users
```

Useful URLs with the example `.env` port:

- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`
- Health: `http://localhost:4000/health`
- Readiness: `http://localhost:4000/ready`

In Swagger, call an authentication endpoint, copy `data.token`, select **Authorize**, and enter the token. Swagger remembers the token until it is cleared. Switch tokens whenever the flow changes actor.

## 3. Institutional onboarding

### 3.1 Platform administrator login

Call `POST /auth/login` using `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD`. Authorize Swagger with the returned platform-admin JWT.

### 3.2 Create and approve an institution

Call `POST /institutions`:

```json
{
  "name": "Demo University",
  "slug": "demo-university",
  "logoUrl": "https://example.com/logo.png"
}
```

Save the returned institution `_id` as `INSTITUTION_ID`. New institutions start as `pending`.

Call `PATCH /institutions/{id}/approve` with `INSTITUTION_ID`. Approval is idempotent.

### 3.3 Invite the first institution administrator

Still using the platform-admin token, call `POST /institutions/{id}/invitations`:

```json
{
  "email": "institution.admin@example.com",
  "role": "institution_admin"
}
```

Only one pending first-admin invitation is allowed, and an institution with an active administrator cannot receive another one in this MVP.

Invitation email delivery is rate-limited per institution and recipient email address. The first send is immediate. A resend must wait 30 seconds; the next resend must wait 2 minutes; subsequent resends require a 1-hour wait. This applies to both platform administrators and institution administrators and counts previous invitation records, including revoked invitations. An early attempt returns HTTP `429` with code `INVITATION_RATE_LIMITED` and the remaining wait time. The cooldown protects recipients from duplicate emails while still allowing administrators to recover from delivery failures.

Brevo sends an activation URL containing the raw invitation token. The database stores only its SHA-256 hash. Copy the `token` query parameter from the email and call `POST /auth/accept-invitation` without authorization:

```json
{
  "token": "RAW_TOKEN_FROM_EMAIL",
  "name": "Institution Admin",
  "password": "StrongPassword123!"
}
```

The token expires after 72 hours and is single-use. Save the returned institution-admin JWT.

### 3.4 Invite an instructor and learner

Authorize Swagger with the institution-admin JWT. Call `POST /institutions/{id}/invitations` twice:

```json
{
  "email": "instructor@example.com",
  "role": "instructor"
}
```

```json
{
  "email": "learner@example.com",
  "role": "learner"
}
```

Accept each invitation through `POST /auth/accept-invitation`. Save both JWTs and the learner's user ID. The institution administrator can confirm membership using:

```http
GET /institutions/{id}/members?page=1&limit=20
```

Role, status, and name/email search filters are available.

## 4. Institutional course-building flow

Authorize Swagger with the instructor JWT.

### 4.1 Create a course

Call `POST /courses`:

```json
{
  "title": "Introduction to Artificial Intelligence",
  "description": "A practical introduction to core AI concepts.",
  "enrollmentMode": "assigned_and_self_enroll"
}
```

The server derives `institutionId`, `instructorId`, and ownership. Save the returned course ID as `COURSE_ID`.

`title` is required. `description`, `thumbnailUrl`, and `enrollmentMode` are optional; when omitted, `enrollmentMode` defaults to `assigned_only`. For a free course, omit both `priceAmount` and `currency`. For a paid course, provide both fields: `priceAmount` is in minor currency units and `currency` is a three-letter ISO code. Supplying only one of these pricing fields is invalid.

### 4.2 Add modules

Call `POST /courses/{courseId}/modules`:

```json
{
  "title": "AI Foundations",
  "order": 0
}
```

Save the module ID as `MODULE_ID`. Module order is unique within a course/module sequence.

### 4.3 Add text and non-text lessons

Create a text lesson with `POST /modules/{moduleId}/lessons`:

```json
{
  "title": "What Is Artificial Intelligence?",
  "order": 0,
  "contentType": "text",
  "contentBody": "Artificial intelligence is the study and construction of systems that perform tasks commonly associated with intelligent behavior."
}
```

Create a video lesson:

For a managed video, complete the Cloudinary upload described in section 10 first. Use the verified `data.url` as `contentUrl` and `data.key` as `mediaKey`:

```json
{
  "title": "Machine Learning Overview",
  "order": 1,
  "contentType": "video",
  "contentUrl": "https://res.cloudinary.com/example/video/upload/...",
  "mediaKey": "cogni-sacra/videos/INSTRUCTOR_USER_ID/VIDEO_ID",
  "aiContext": "This lesson explains supervised learning, unsupervised learning, training data, models, and inference."
}
```

`contentBody` is required only for text lessons. `contentUrl` and `aiContext` are required for video/link lessons. `plainTextForAI` is always generated by the server and cannot be supplied by clients.

Use `PATCH /modules/{id}`, `PATCH /lessons/{id}`, and `DELETE /lessons/{id}` for editing. Module deletion requires `DELETE /modules/{id}?confirm=true` and removes its lessons transactionally.

### 4.4 Create an assessment

Call `POST /courses/{courseId}/assessments`:

```json
{
  "title": "AI Foundations Quiz",
  "passingScorePercent": 60,
  "maxAttempts": 2,
  "questions": [
    {
      "text": "Which learning type uses labelled examples?",
      "options": ["Supervised learning", "Unsupervised learning", "Random search"],
      "correctOptionIndex": 0
    },
    {
      "text": "What does a trained model perform on new data?",
      "options": ["Inference", "Deletion", "Compression only"],
      "correctOptionIndex": 0
    }
  ]
}
```

Save the assessment ID as `ASSESSMENT_ID`. Correct answer indexes are removed from learner-facing responses.

### 4.5 Publish the course

Call `POST /courses/{id}/publish`. A course needs at least one module and one lesson. Repeated publication is safe.

## 5. Institutional learner flow

### 5.1 Assign the course

Using either the owning instructor token or institution-admin token, call `POST /courses/{id}/assign`:

```json
{
  "learnerId": "INSTITUTION_LEARNER_USER_ID"
}
```

Assignment requires a published course and a learner in the same institution. Repeated assignment returns the existing enrollment.

### 5.2 Consume lessons and track progress

Authorize with the institutional learner JWT.

1. `GET /learner/courses`
2. `GET /courses/{courseId}/lessons/{lessonId}`
3. `POST /lessons/{lessonId}/complete`
4. `GET /learner/courses/{courseId}/progress`

Lesson completion is idempotent. Progress is calculated as completed lessons divided by total lessons. Completing every lesson changes enrollment status to `completed`.

### 5.3 Use the grounded AI Tutor

Call `POST /courses/{id}/ai-tutor/ask`:

```json
{
  "question": "What learning types were introduced in the video lesson?"
}
```

The backend verifies enrollment, builds bounded context from text lesson bodies and non-text `aiContext`, forces an OpenAI Responses API function call, validates all cited lesson IDs against the supplied context, and persists the exchange. Unsupported questions return that the topic is not covered rather than using outside knowledge. The default `gpt-5-nano` model is selected for minimum API cost; change `AI_MODEL` only after evaluating grounding quality against the tutor test set.

Retrieve history with:

```http
GET /courses/{id}/ai-tutor/history?page=1&limit=20
```

Rate limiting is keyed by authenticated learner ID rather than IP address.

### 5.4 Submit the assessment

First call `GET /assessments/{id}` and confirm that `correctOptionIndex` is absent. Then submit only answer indexes:

```json
{
  "answers": [0, 0]
}
```

Call `POST /assessments/{id}/submit`. The backend calculates score and pass/fail, allocates the attempt number atomically, and enforces `maxAttempts` inside a MongoDB transaction.

Retrieve attempt history with `GET /assessments/{id}/results/me`. Sending `score`, `passed`, or `attemptNumber` is rejected as an unknown field.

## 6. Public catalog and independent learner flow

### 6.1 Publish an institution course publicly

With the instructor JWT, call `POST /courses/{id}/request-publication`. This moves an institution-owned course to `public_requested`.

Switch to the institution-admin JWT and call `POST /courses/{id}/approve-publication`. The course then appears in:

```http
GET /courses/public?page=1&limit=20
```

Catalog metadata is public, but lessons, progress, assessments, and AI Tutor require an authenticated enrollment.

### 6.2 Create a platform-owned public course

A platform admin can call `POST /courses`, build modules and lessons, publish it, and call `POST /courses/{id}/request-publication`. Platform-owned courses become public directly because they do not need institution approval.

### 6.3 Register an independent learner

Call `POST /auth/register`:

```json
{
  "name": "Independent Learner",
  "email": "independent@example.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

Verify the email through `GET /auth/verify-email?token=...`, log in, and authorize Swagger with the independent-learner JWT. Google login through `POST /auth/google` creates the same role.

To choose the final public role, call `POST /account/onboarding` after login:

```json
{
  "accountType": "instructor",
  "interests": ["artificial intelligence"]
}
```

Use `"accountType": "learner"` to remain an independent learner. Onboarding can only be completed once. The registration endpoint itself does not accept `accountType`.

### 6.4 Free public enrollment

For a public course without a positive price, call `POST /courses/{id}/enroll`. Continue through the same lesson, progress, assessment, AI Tutor, and summary endpoints used by institutional learners.

### 6.5 Paid public enrollment

Create the course with price in minor currency units. Both pricing fields are required together:

```json
{
  "title": "Premium AI Foundations",
  "description": "Paid public course",
  "enrollmentMode": "self_enroll",
  "priceAmount": 2500,
  "currency": "USD"
}
```

After the course is public and `FEATURE_PAID_ENROLLMENT=true`, the independent learner calls:

```http
POST /courses/{id}/checkout
```

The generic payment endpoint is separate from course checkout. Authenticated users may call `POST /payments/create-intent` with `amount` (minimum 50 minor units), optional lowercase three-letter `currency` (default `usd`), and optional string metadata. Payment history is available through `GET /payments/my-payments`. These generic payment records do not enroll a learner in a course; course access is created only by the signed checkout webhook flow.

Open the returned `checkoutUrl` and complete payment using Stripe test mode. Stripe must deliver `checkout.session.completed` to:

```text
POST /webhooks/stripe
```

The webhook signature is verified. Course, learner, institution metadata, course visibility, and payment status are checked before an idempotent `paid` enrollment is created. A browser redirect alone never grants access.

For local Stripe CLI testing:

```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```

Copy the emitted signing secret to `STRIPE_WEBHOOK_SECRET`.

## 7. Virtual Library Lite

Set `FEATURE_VIRTUAL_LIBRARY=true`.

- A platform admin calling `POST /library` creates a platform-visible resource.
- An institution admin calling the same endpoint creates an institution-scoped resource.
- Authenticated users call `GET /library?page=1&limit=20&search=ai` and see platform resources plus resources applicable to their institution.
- Only the administrator responsible for a resource's visibility scope can update or delete it through `PATCH /library/{id}` and `DELETE /library/{id}`.

Example resource:

```json
{
  "title": "Artificial Intelligence: A Modern Approach",
  "description": "A foundational AI reference.",
  "authors": ["Stuart Russell", "Peter Norvig"],
  "subjects": ["Artificial Intelligence"],
  "resourceType": "book",
  "url": "https://example.com/resources/ai-modern-approach",
  "aiSummary": "A broad introduction to intelligent agents and AI methods."
}
```

## 8. Analytics flow

After the learner has completed lessons and submitted an assessment:

- Instructor: `GET /instructor/courses/{id}/analytics`
- Institution admin or platform admin: `GET /institutions/{id}/analytics`
- Enrolled learner: `GET /learner/courses/{id}/summary`

The learner summary returns progress, completed/total lessons, enrollment status, and one summary entry for every assessment.

## 9. Media flow

Authenticated users can upload supported files through:

- `POST /media/image` using multipart field `image`
- `POST /media/video` using multipart field `video`

The multipart video endpoint is intended for small videos only (currently 100 MB) because the API buffers the file in memory. For large videos, use the production upload flow:

1. Call `POST /media/video/upload-signature` with an instructor/admin JWT.
2. Upload directly from the browser to the returned Cloudinary `uploadUrl` using the returned signed fields. Use Cloudinary's chunked upload support and the returned `chunkSizeBytes`; do not send the 1–2 GB file through this API.
3. After Cloudinary reports success, call `POST /media/video/complete` with `{ "publicId": "..." }`.
4. Use the verified `data.url` as the lesson `contentUrl` and `data.key` as the lesson `mediaKey`.

When replacing a video, send both the new `contentUrl` and new `mediaKey` in the lesson update. The backend saves the new lesson first and then deletes the previous Cloudinary asset. If the upload or lesson update fails, the previous video remains available. Deleting a lesson also removes its managed video asset.

The signature creates a unique user-scoped asset path, expires through Cloudinary's timestamp rules, and the completion endpoint verifies that the asset is a video owned by the requesting user's upload path. The configured default maximum is 2 GiB (`VIDEO_UPLOAD_MAX_BYTES=2147483648`) and the default chunk size is 20 MiB (`VIDEO_UPLOAD_CHUNK_SIZE_BYTES=20971520`). Upload middleware enforces MIME type restrictions on the legacy multipart endpoint.

## 10. Required negative tests

Run these checks before accepting a deployment:

1. An institution admin cannot retrieve or mutate another institution's resources.
2. An instructor cannot edit another instructor's course.
3. A learner cannot read a lesson without enrollment.
4. An independent learner cannot access a private institution course.
5. An institution course is absent from the public catalog before admin approval.
6. A client-supplied `institutionId`, `role`, score, pass state, attempt number, or AI citation is rejected or ignored as specified.
7. A used, expired, or revoked invitation cannot create an account.
8. A second first-admin invitation is rejected.
9. Repeated invitations to the same institution/email are rejected during the 30-second, 2-minute, and 1-hour cooldown windows.
10. Two simultaneous final assessment submissions create at most one allowed attempt.
11. Learner assessment retrieval never exposes `correctOptionIndex`.
12. A hallucinated AI lesson ID is removed from response citations.
13. Rate limiting one learner does not consume another learner's allowance.
14. A forged Stripe webhook signature creates no enrollment.
15. Re-delivery of a valid checkout webhook creates no duplicate enrollment.
16. Feature-flagged library and paid enrollment endpoints return `FEATURE_DISABLED` when disabled.

## 11. Common response and error shapes

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "request-correlation-id"
}
```

Use `requestId` to correlate an API error with structured server logs. Production responses do not expose stack traces, database queries, provider credentials, raw invitation tokens, or course context sent to the AI provider.

## 12. Frontend implementation contract

The frontend should be implemented as a role-aware application consuming `SERVER_URL/api/v1`. The examples below assume React with React Router and TanStack Query, but the same boundaries apply to Next.js, Vue, Angular, or a mobile client.

### 12.1 Recommended frontend layers

```text
src/
├── app/                 # router, providers, startup/session restoration
├── api/                 # HTTP client and typed endpoint functions
├── auth/                # auth store, guards, login/register/invitation screens
├── layouts/             # public, platform, institution, instructor, learner layouts
├── features/
│   ├── institutions/
│   ├── members/
│   ├── courses/
│   ├── course-builder/
│   ├── learning/
│   ├── assessments/
│   ├── ai-tutor/
│   ├── analytics/
│   ├── library/
│   └── checkout/
├── components/          # reusable UI without business ownership
├── types/               # API contracts and role/status unions
└── utils/               # formatting and error helpers
```

Keep server state in a request-cache library. Keep only session and temporary UI state in a global client store. Do not duplicate courses, enrollments, analytics, or tutor history into a second global cache.

### 12.2 Shared TypeScript contracts

The frontend should define the following core types from the API contract:

```ts
type UserRole =
  | 'platform_admin'
  | 'institution_admin'
  | 'instructor'
  | 'learner'
  | 'independent_learner'
  | 'independent_instructor';

type UserStatus = 'pending_institution' | 'invited' | 'active' | 'suspended';

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
  code: string;
  requestId: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  institutionId?: string;
  isEmailVerified: boolean;
}
```

IDs should always remain strings in the frontend. Never send `institutionId`, ownership IDs, roles, scores, attempt numbers, progress values, publication timestamps, or AI citations from editable forms.

### 12.3 HTTP client behavior

Create one HTTP client with these rules:

1. Base URL is `${API_URL}/api/v1`.
2. Add `Authorization: Bearer <token>` when a session exists.
3. Send `Content-Type: application/json` except for multipart uploads.
4. Parse the response envelope centrally.
5. Convert non-2xx responses into a typed `ApiFailure`.
6. On `401`, clear the session and redirect to `/login`, preserving the intended return URL.
7. On `403 ACCOUNT_NOT_PROVISIONED`, show a provisioning screen rather than a generic forbidden page.
8. On `403 ACCOUNT_UNAVAILABLE`, clear the session and show the account-state message.
9. Display the server `message`; expose `requestId` in an expandable support detail.
10. Do not automatically retry mutations. Retry safe GET requests only for transient network/5xx failures.

Example client boundary:

```ts
async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStore.getState().token;
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !payload.success) throw payload;
  return payload.data;
}
```

### 12.4 Session storage and startup

Prefer a secure, HTTP-only same-site cookie if the backend later supports cookie sessions. With the current bearer-token API, store the JWT in memory and optionally session storage for tab refresh support. Avoid long-lived local storage where possible because JavaScript-accessible persistence increases token theft impact.

Application startup should follow this sequence:

```text
Read stored token
    ↓
No token → render public routes
    ↓
Token exists → GET /auth/me
    ↓
Valid active user → populate session and role navigation
401/403 → clear token and render login/account-state screen
```

Never derive authority solely from decoded JWT claims. Use `/auth/me` as the current user source because the backend reloads role, institution, and status from MongoDB on authenticated requests.

### 12.5 Route guards and post-login destinations

Use two guard levels:

- `RequireAuth`: requires a restored active session.
- `RequireRole`: accepts an explicit role list and renders a 403 page for other roles.

Recommended landing routes:

| Role                  | Landing route                  |
| --------------------- | ------------------------------ |
| `platform_admin`      | `/platform/institutions`       |
| `institution_admin`   | `/institution/dashboard`       |
| `instructor`          | `/instructor/courses`          |
| `learner`             | `/learn/courses`               |
| `independent_learner` | `/catalog` or `/learn/courses` |
| `independent_instructor` | `/independent-instructor/courses` |

The frontend may hide unauthorized actions for usability, but backend authorization remains authoritative. A hidden button is not a security control.

## 13. Frontend screens and role flows

### 13.0 Independent instructor flow

The registration screen collects only name, email, password, and confirmation, so the account is initially an independent learner. After email verification and login, show the onboarding choice **Continue as Learner** or **Become an Instructor** and send the selected value to `POST /account/onboarding`. Google login creates new users as independent learners and does not accept an account type.

Independent instructors use these routes:

```text
/independent-instructor/courses
/independent-instructor/courses/new
/independent-instructor/courses/:id/edit
/independent-instructor/courses/:id/analytics
/independent-instructor/courses/:id/earnings
```

Reuse the course builder, but omit institution selectors, member assignment, approval requests, and institution analytics. A course is always institution-less, starts as a draft, and `POST /courses/:id/publish` performs the completeness check (at least one module and lesson) before making it public. Free enrollment uses `POST /courses/:id/enroll`; paid enrollment uses the public checkout endpoint and Stripe webhook. Earnings displays paid/free enrollment counts and gross sales by currency; it is owner-scoped and does not represent payouts or net revenue.

### 13.1 Public application

Public routes:

```text
/
/catalog
/login
/register
/verify-email
/forgot-password
/reset-password
/accept-invitation
/checkout/result
```

The catalog calls `GET /courses/public`. Use URL query parameters for `page`, `limit`, and `search` so filtering is shareable and browser navigation works. Course cards should show title, description, thumbnail, price/free state, and an action determined by session state:

- Logged out: **Sign in to enroll**.
- Independent learner, free course: **Enroll**.
- Independent learner, paid course: **Buy course**.
- Already enrolled: **Continue learning**.
- Institutional roles: do not present cross-tenant public enrollment unless the backend later enables it.

### 13.2 Authentication screens

`/register` is labelled **Public registration**. It sends only name, email, password, and confirmation. After success, show an email-verification message; do not assume a JWT was returned. After verification and login, `/account/onboarding` accepts `accountType` (`learner` or `instructor`) and an optional interests array.

`/login` stores `data.token` and `data.user`, then redirects to the role landing route or the preserved return URL.

`/accept-invitation` reads `token` from the URL, displays name/password fields, and calls `POST /auth/accept-invitation`. On success, store the returned session and redirect by role. Remove the token from browser history using route replacement so it is not retained in normal navigation.

`/verify-email` reads the email token and calls the verification endpoint once. Protect the call from React development-mode double execution by tracking whether the mutation has already started.

### 13.3 Platform administrator application

Navigation:

- Institutions
- Platform courses
- Public library
- Users

Institution list/create page:

1. Submit name, slug, and optional logo through `POST /institutions`.
2. Keep the returned institution ID in the route: `/platform/institutions/:id`.
3. Render status and an **Approve institution** action while pending.
4. After approval, render the **Invite first administrator** form.
5. Disable the form after a successful invite and show its expiry time.

The platform course builder uses the same builder described below, but its courses have no institution or instructor supplied by the client. Its **Publish publicly** action calls `request-publication` and becomes public immediately.

### 13.4 Institution administrator application

Dashboard widgets call `GET /institutions/{id}/analytics`, using `session.user.institutionId` as the route ID. Never allow an institution ID text field.

Members page:

- Calls `GET /institutions/{id}/members` with debounced search and server pagination.
- Provides invitation forms only for `instructor` and `learner`.
- Shows invitation success without displaying or requesting the raw token; delivery happens by email.

Public-course approval queue:

- Shows institution courses whose visibility is `public_requested`.
- Displays course metadata and a confirmation dialog.
- Calls `POST /courses/{id}/approve-publication`.
- Invalidates the institution course list and public catalog cache after success.

### 13.5 Instructor course builder

Recommended builder route hierarchy:

```text
/instructor/courses
/instructor/courses/new
/instructor/courses/:courseId/edit
/instructor/courses/:courseId/assessments/new
/instructor/courses/:courseId/analytics
```

Builder steps:

1. **Details** — title, description, thumbnail, enrollment mode, and optional public-course price.
2. **Curriculum** — ordered modules and lessons.
3. **Assessments** — question editor with option validation. The current service supports assessment creation only for an institutional `instructor` who owns an institution course; independent instructors and platform admins cannot currently create assessments.
4. **Review** — completeness summary and publish action.
5. **Distribution** — assigned-only controls or public-publication request.

For lessons, switch fields based on `contentType`:

| Type    | Required frontend fields                                        |
| ------- | --------------------------------------------------------------- |
| `text`  | `contentBody` rich-text/Markdown editor                         |
| `video` | `contentUrl` and visible `aiContext` transcript/summary editor  |
| `link`  | `contentUrl` and visible `aiContext` description/summary editor |

Explain beside `aiContext` that it is the material the tutor may use. Do not expose `plainTextForAI` as an editable input.

Ordering should use integer positions. After adding, deleting, or dragging items, send explicit unique order values. If reordering several records is added later, implement a backend batch-reorder endpoint rather than firing uncontrolled parallel PATCH requests.

Publishing UI must surface `COURSE_INCOMPLETE` beside the curriculum checklist. After publication:

- `assigned_only`: show learner assignment controls.
- Institution public course: show **Request public publication**, followed by a pending-approval badge.
- Platform public course: show **Publish to catalog**.

### 13.6 Learner classroom

Recommended learner routes:

```text
/learn/courses
/learn/courses/:courseId
/learn/courses/:courseId/lessons/:lessonId
/learn/courses/:courseId/assessments/:assessmentId
/learn/courses/:courseId/summary
```

Course workspace layout:

- Sidebar: ordered modules and lessons.
- Main panel: text, embedded video, or external-link lesson content.
- Progress header: percentage and completion state.
- Secondary panel: AI Tutor conversation.
- Assessment cards: attempts used, maximum attempts, latest score, and pass state.

When **Complete lesson** succeeds, optimistically disable the button but use the returned enrollment as the final truth. Invalidate course progress, course summary, and learner-course queries. Repeated completion must remain visually successful because the API is idempotent.

Do not unlock content based only on frontend state. If a lesson call returns `ENROLLMENT_REQUIRED`, remove stale enrollment data and return the learner to the appropriate catalog/course page.

### 13.7 Assessment user experience

Load `GET /assessments/{id}` only after enrollment. Keep answers in local component state and send exactly:

```json
{ "answers": [0, 2, 1] }
```

Disable the submit button while the request is pending to reduce accidental double clicks, while still relying on backend concurrency protection. On result:

- Show server-calculated percentage and pass/fail.
- Refresh `/results/me` and the learner summary.
- On `MAX_ATTEMPTS_REACHED`, permanently disable submission and show attempt history.
- On `ATTEMPT_ALREADY_RECORDED`, refresh results instead of showing a generic failure.

Never download or cache instructor assessment objects containing answer keys in learner-facing bundles or state.

### 13.8 AI Tutor user experience

Render previous messages from `GET /courses/{id}/ai-tutor/history`. Submit questions to the ask endpoint and append the returned answer only after success.

Each answer should display:

- Grounded/not-grounded state.
- Linked source lesson titles when sources exist.
- The exact unsupported-course-material message when `grounded` is false.

Map AI errors as follows:

| Status/code                   | Frontend behavior                                             |
| ----------------------------- | ------------------------------------------------------------- |
| `429`                         | Show the hourly limit message and disable sending temporarily |
| `503 AI_PROVIDER_UNAVAILABLE` | Preserve the typed question and offer retry                   |
| `503 AI_INVALID_RESPONSE`     | Show a safe temporary failure; never render raw provider data |
| `ENROLLMENT_REQUIRED`         | Exit the classroom and refresh enrollment state               |

Do not stream or fabricate partial answers because the current backend returns one forced structured tool result.

### 13.9 Checkout user experience

For a paid public course:

1. Call `POST /courses/{id}/checkout`.
2. If an enrollment is returned, navigate directly to the classroom.
3. Otherwise redirect the browser to `checkoutUrl`.
4. Stripe returns to `/courses/:id?checkout=success` or `checkout=cancelled`.
5. A success query parameter means only that the browser returned; it is not entitlement proof.
6. Poll `GET /learner/courses` with bounded retries until the signed webhook-created enrollment appears.
7. Stop polling after a short timeout and show **Payment received; access is still being confirmed** with a manual refresh action.

Never mark a course purchased solely from the Stripe redirect.

### 13.10 Library and analytics screens

The library screen uses server-side pagination/search. Platform and institution administrators see create/edit/delete controls appropriate to their scope. Other authenticated roles see read-only results.

Analytics screens should render loading, empty, and populated states. Treat zero enrollments as a valid empty state, not an API error. Format percentages consistently and show raw counts alongside rates so demo data remains understandable.

## 14. Frontend cache and mutation rules

Suggested query keys:

```ts
['session'][('public-courses', filters)][('institution', institutionId)][
  ('institution-members', institutionId, filters)
][('course', courseId)]['learner-courses'][('course-progress', courseId)][
  ('course-summary', courseId)
][('assessment', assessmentId)][('assessment-results', assessmentId)][
  ('tutor-history', courseId, page)
][('course-analytics', courseId)][('institution-analytics', institutionId)][('library', filters)];
```

Mutation invalidation:

| Mutation                              | Invalidate/refetch                     |
| ------------------------------------- | -------------------------------------- |
| Create/update/publish course          | Owned course list and course detail    |
| Approve public publication            | Institution courses and public catalog |
| Assign/enroll/paid entitlement        | Learner courses and course detail      |
| Complete lesson                       | Progress, summary, learner courses     |
| Submit assessment                     | Results, summary, analytics            |
| Ask tutor                             | Tutor history                          |
| Create/update/delete library resource | Library search results                 |

Use idempotency-aware UX: repeated institution approval, course assignment, lesson completion, and publication should resolve as success. Invitation acceptance and assessment submissions are not repeatable in the same way and must display their specific error code.

## 15. Forms, accessibility, and validation

Mirror Joi constraints for immediate feedback, but always render backend validation messages because backend rules are authoritative.

- Associate labels, descriptions, and errors with every input.
- Move focus to the first invalid field after submission.
- Confirm destructive module deletion and explain that lessons will also be deleted.
- Do not encode role permissions only through color or icons.
- Provide keyboard access to course ordering controls in addition to drag-and-drop.
- Announce progress, assessment results, invitation completion, and checkout confirmation through an accessible live region.
- Never place passwords, JWTs, invitation tokens, AI keys, or Stripe secrets in logs or analytics events.

## 16. Frontend error-state matrix

| Code/status                | Meaning                                      | Required UI response                        |
| -------------------------- | -------------------------------------------- | ------------------------------------------- |
| `401`                      | Missing/expired token                        | Clear session and redirect to login         |
| `FORBIDDEN`                | Role or ownership denial                     | Render 403 without retry                    |
| `ACCOUNT_NOT_PROVISIONED`  | Migrated tenant user lacks institution       | Render provisioning support screen          |
| `ACCOUNT_UNAVAILABLE`      | Suspended/inactive account                   | Clear session and show account status       |
| `INSTITUTION_NOT_APPROVED` | Onboarding is incomplete                     | Return admin to institution status page     |
| `COURSE_INCOMPLETE`        | Publish prerequisites missing                | Highlight curriculum review checklist       |
| `ENROLLMENT_REQUIRED`      | Learner lacks course entitlement             | Refresh learner courses and leave classroom |
| `PAYMENT_REQUIRED`         | Paid public course used free-enroll endpoint | Start checkout flow                         |
| `MAX_ATTEMPTS_REACHED`     | No assessment attempts remain                | Disable submission and show results         |
| `ATTEMPT_ALREADY_RECORDED` | Concurrent/retried submission conflict       | Refresh attempt results                     |
| `FEATURE_DISABLED`         | Optional module disabled                     | Hide feature navigation after confirmation  |
| `429`                      | Request rate limit                           | Disable action until retry is reasonable    |
| `5xx/503`                  | Temporary server/provider failure            | Preserve user input and offer retry         |

## 17. Backend additions required for a complete production frontend

The current API implements the core write and learner flows, but a complete frontend needs the following read contracts added before its corresponding screens can be considered finished:

1. `GET /instructor/courses` — paginated courses owned by the authenticated instructor.
2. `GET /institutions/{id}/courses` — paginated institution course list with status and public-approval filters.
3. `GET /courses/{id}/curriculum` — course with ordered modules and learner-safe or editor-safe lessons according to role.
4. `GET /courses/{courseId}/assessments` — list course assessments, stripping answer keys for learners.
5. Lesson resource upload/delete endpoints from the original specification.
6. Invitation list/resend/revoke endpoints if administrators must manage delivery failures.
7. A checkout-entitlement status endpoint or enrollment detail endpoint to replace broad polling after Stripe redirect.
8. Refresh-token or secure cookie session support if long-lived browser sessions are required.

Until these are implemented, the frontend must not simulate missing server data, query MongoDB directly, or infer curriculum/approval state from unrelated endpoints.

## 18. Frontend acceptance checklist

The frontend is complete when all of the following work against the real API:

1. Session restores through `/auth/me` and redirects correctly by role.
2. Platform admin creates/approves an institution and initiates its first-admin invitation.
3. Invitation token opens the activation page and creates an authenticated institutional user.
4. Institution admin invites instructor/learner and sees scoped members.
5. Instructor creates a course with text and non-text grounded lessons, assessment, and publishes it.
6. Institution admin approves a requested public course.
7. Institutional learner receives an assignment and completes the learning/assessment/tutor flow.
8. Independent learner registers, verifies email, browses public courses, and enrolls.
9. Paid checkout grants access only after webhook-confirmed enrollment.
10. Tutor sources navigate to valid lessons and unsupported questions are visibly ungrounded.
11. Role navigation exposes no unauthorized actions and direct unauthorized URLs render correctly.
12. All important mutations have loading, success, domain-error, and retry-safe states.
13. Mobile, keyboard, and screen-reader navigation cover course learning and assessments.
14. No secret, token, answer key, cross-tenant identifier, or privileged server field is exposed in client logs or editable state.
