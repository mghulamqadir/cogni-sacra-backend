# Cogni-Sacra User Flow

This guide explains the complete product journey in plain language. It is intended for product owners, designers, QA testers, and frontend developers.

## 1. Choosing an account

When a visitor selects **Register**, the first screen presents two choices:

- **Continue as Learner** — browse public courses and study them.
- **Become an Instructor** — create and sell public courses.

The visitor then enters their name, email, and password. After registration, they verify their email and sign in.

Institutional users do not register from this screen. They receive an invitation from their institution and activate their account using the invitation link.

## 2. Learner journey

### Independent learner

1. Register as a learner.
2. Verify the email address.
3. Open the public course catalog.
4. View course descriptions, instructor information, price, and enrollment options.
5. Choose a free course or complete payment for a paid course.
6. Open the course after enrollment.
7. Study modules and lessons.
8. Mark lessons complete and view progress.
9. Complete available assessments.
10. Use the AI Tutor while studying. Answers are based on the course material.
11. Review course progress and assessment results from the learner dashboard.

Independent learners cannot see private institutional courses, institution members, assignments, or institution administration pages.

### Institutional learner

1. Receive an invitation from an institution.
2. Open the invitation link before it expires.
3. Choose a name and password.
4. Sign in to the institution workspace.
5. View courses assigned by an administrator or instructor.
6. Self-enroll in institution courses when the course allows it.
7. Study lessons, complete assessments, use the AI Tutor, and track progress.

Institutional learners only see content belonging to their own institution.

## 3. Independent instructor journey

1. Register using **Become an Instructor**.
2. Verify the email address and sign in.
3. Open the instructor dashboard.
4. Select **Create course**.
5. Add the course title, description, thumbnail, enrollment type, and optional price.
6. Add at least one module.
7. Add at least one lesson to the module.
8. Add text, video, or link content. Video and link lessons should include useful lesson context for the AI Tutor.
9. Add assessments and learning resources when needed.
10. Review the course preview.
11. Select **Publish course** once the course is complete.
12. The course becomes visible in the public catalog after publishing.
13. Monitor free enrollments, paid enrollments, learner progress, and gross sales.

Independent instructors can manage only their own courses. Their courses are always public and are not connected to an institution.

They cannot invite institution members, assign institutional learners, manage institutions, or approve institutional courses.

## 3.1 Who creates courses?

- Platform administrators create platform-owned courses.
- Institutional instructors create courses for their institution.
- Independent instructors create their own public courses.
- Institution administrators do not create course content. They manage institution settings, members, resources, and publication approvals.
- Learners do not create courses.

## 4. Institutional instructor journey

1. Receive an invitation from an institution administrator.
2. Activate the account and choose a password.
3. Open the instructor workspace.
4. Create a course for the assigned institution.
5. Build modules, lessons, assessments, and resources.
6. Publish the course for institutional use.
7. Assign the course to learners when required.
8. View learner progress and assessment performance.
9. Request public publication when the institution wants the course listed publicly.

An institutional instructor can manage only courses belonging to their institution and cannot approve their own public request.

## 5. Institution administrator journey

1. Receive and activate the administrator invitation.
2. Open the institution dashboard.
3. Invite instructors and learners by email.
4. Review institution members and their account status.
5. Manage institution courses and resources.
6. Approve or reject instructor requests to publish courses publicly.
7. View institution-wide enrollment, progress, completion, and assessment information.

Institution administrators can manage only their own institution. They cannot manage another institution's users or courses.

## 6. Platform administrator journey

1. Sign in to the platform administration area.
2. Create and approve institutions.
3. Invite the first administrator for each institution.
4. Manage platform-owned public courses.
5. Manage shared library resources.
6. View platform-level administration and operational information.

The platform administrator is not part of an institution and is not enrolled as a learner through normal course enrollment.

## 7. Public course journey

### Free course

1. A visitor opens the public catalog.
2. The visitor opens a course details page.
3. The visitor registers or signs in as an independent learner.
4. The learner selects **Enroll free**.
5. The course appears in the learner dashboard.

### Paid course

1. A visitor opens the public catalog.
2. The visitor views the course price and currency.
3. The visitor registers or signs in as an independent learner.
4. The learner selects **Buy course**.
5. The learner completes payment.
6. The course appears in the learner dashboard after payment confirmation.

If payment is cancelled or unsuccessful, the learner does not receive course access.

## 8. Course visibility states

- **Draft** — visible only to the course owner and authorized institution users.
- **Published for institution** — available inside the institution workspace.
- **Awaiting approval** — an institution instructor has requested public publication.
- **Public** — listed in the public catalog and available for independent enrollment.
- **Archived** — no longer offered for new enrollment, while existing records remain available according to platform policy.

Independent instructor courses become public when the instructor publishes them. Institution courses become public only after institution administrator approval.

## 9. Learning experience

Learners can:

- Open enrolled courses.
- Navigate modules and lessons.
- Complete lessons and see progress.
- Submit assessments within the allowed attempt limit.
- Review scores and pass/fail results.
- Ask the AI Tutor questions about the current course.
- See source citations when the AI Tutor provides an answer.

Learners cannot open lessons from courses in which they are not enrolled.

## 10. AI Tutor experience

The AI Tutor is available inside an enrolled course while a learner is studying. It is designed to explain the course material, not to act as a general-purpose chat service.

### Learner flow

1. Open an enrolled lesson.
2. Open the **AI Tutor** panel.
3. Ask a question about the lesson or course.
4. Read the explanation and review the referenced course sources.
5. Ask a follow-up question if clarification is needed.
6. Continue studying with the conversation saved in the course history.

The AI Tutor should:

- Use the current lesson and relevant course material as its knowledge base.
- Explain concepts in clear, learner-friendly language.
- Say when the course material does not contain enough information.
- Provide citations or source references for factual answers.
- Avoid presenting unsupported guesses as course facts.

The AI Tutor should not reveal assessment answer keys, private instructor notes, hidden lesson data, or information from another course or institution. Learners must be enrolled before they can use it.

### Instructor flow

Instructors make the AI Tutor more useful by preparing good lesson context:

1. Add complete lesson text, video descriptions, transcripts, or summaries.
2. Check that the lesson context accurately represents the teaching material.
3. Preview the lesson and test typical learner questions.
4. Correct unclear or incomplete content before publishing.

For video and link lessons, the instructor should provide a transcript, summary, or other meaningful explanation. This gives the AI Tutor reliable material to use when answering questions.

### AI conversation history

Learners can return to previous questions within the course. Conversation history is associated with the learner and course, so it is not shared with other learners. Instructors and administrators may view only the analytics or records explicitly allowed by the product policy; private learner conversations should not be exposed by default.

### AI limits and safety

The product should show a friendly message when:

- The question is unrelated to the course.
- The answer cannot be supported by course material.
- The learner has reached the usage limit.
- The AI service is temporarily unavailable.

The learner can then rephrase the question, review the lesson, or contact the instructor. The AI Tutor supports learning but does not replace the instructor, course assessments, or professional advice.

## 11. Email and account safety

- Invitation links are single-use and expire after the configured period.
- Verification links expire and cannot be reused after completion.
- Users choose their own passwords during activation.
- Passwords never appear in email messages.
- A user sees the account role and institution name in an invitation email.
- Suspended users cannot continue using protected areas until reactivated.

### Invitation resend protection

Invitation sending is limited per institution and recipient email address. The first invitation can be sent immediately. If an administrator sends another invitation to the same address, the waiting periods are:

- First resend: wait 30 seconds.
- Second resend: wait 2 minutes.
- Later resends: wait 1 hour between attempts.

The restriction applies to platform administrators and institution administrators alike. It prevents accidental repeated sends and protects recipients from email abuse. The API responds with the remaining wait time when an invitation is attempted too early.

## 12. Frontend navigation summary

| User type | Main destination |
|---|---|
| Independent learner | Public catalog and learner dashboard |
| Independent instructor | Independent instructor dashboard |
| Institutional learner | Institution learner dashboard |
| Institutional instructor | Institution course workspace |
| Institution administrator | Institution administration dashboard |
| Platform administrator | Platform administration dashboard |

The frontend should hide controls that do not apply to the current user, while still showing clear messages when an action is unavailable.
