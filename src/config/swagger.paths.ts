import { env } from './env.js';

const security = [{ bearerAuth: [] }];
const body = (name: string, required = true) => ({ required, content: { 'application/json': { schema: { $ref: `#/components/schemas/${name}` } } } });
const ok = (description = 'Operation completed successfully') => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } });
const errors = { 400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }, 401: { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }, 403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }, 404: { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }, 409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }, 422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } };
const id = (name = 'id') => ({ name, in: 'path', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } });
const paging = [{ name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }];
const operation = (tags: string[], summary: string, options: Record<string, unknown> = {}) => ({ tags, summary, security, responses: { 200: ok(), ...errors }, ...options });

export const swaggerPaths = {
  '/auth/register': { post: { tags: ['Auth'], summary: 'Register an independent learner', requestBody: body('RegisterBody'), responses: { 201: ok('Registration successful'), 409: errors[409], 422: errors[422] } } },
  '/auth/login': { post: { tags: ['Auth'], summary: 'Login with email and password', requestBody: body('LoginBody'), responses: { 200: ok('Login successful'), 401: errors[401], 403: errors[403], 422: errors[422] } } },
  '/auth/google': { post: { tags: ['Auth'], summary: 'Login or register an independent learner with Google', requestBody: body('GoogleLoginBody'), responses: { 200: ok(), 401: errors[401], 409: errors[409], 422: errors[422] } } },
  '/auth/accept-invitation': { post: { tags: ['Auth'], summary: 'Activate an invited institutional account', requestBody: body('AcceptInvitationBody'), responses: { 201: ok('Invitation accepted'), ...errors } } },
  '/auth/verify-email': { get: { tags: ['Auth'], summary: 'Verify email', parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }], responses: { 200: ok(), 400: errors[400], 401: errors[401] } } },
  '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Send password reset email', requestBody: body('ForgotPasswordBody'), responses: { 200: ok(), 422: errors[422] } } },
  '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password', requestBody: body('ResetPasswordBody'), responses: { 200: ok(), 401: errors[401], 422: errors[422] } } },
  '/auth/me': { get: operation(['Auth'], 'Get authenticated user') },
  '/auth/change-password': { patch: operation(['Auth'], 'Change password', { requestBody: body('ChangePasswordBody') }) },
  '/users/me': { get: operation(['Users'], 'Get own profile'), patch: operation(['Users'], 'Update own profile', { requestBody: body('UpdateProfileBody') }) },
  '/users': { get: operation(['Users'], 'List all users (platform admin)', { parameters: [...paging, { name: 'role', in: 'query', schema: { type: 'string', enum: ['platform_admin', 'institution_admin', 'instructor', 'learner', 'independent_learner'] } }, { name: 'search', in: 'query', schema: { type: 'string' } }] }) },
  '/users/{id}': { get: operation(['Users'], 'Get user (platform admin)', { parameters: [id()] }), delete: operation(['Users'], 'Delete user (platform admin)', { parameters: [id()] }) },

  '/institutions': { post: operation(['Institutions'], 'Create institution (platform admin)', { requestBody: body('InstitutionBody'), responses: { 201: ok(), ...errors } }) },
  '/institutions/{id}/approve': { patch: operation(['Institutions'], 'Approve institution (platform admin)', { parameters: [id()] }) },
  '/institutions/{id}': { get: operation(['Institutions'], 'Get institution', { parameters: [id()] }) },
  '/institutions/{id}/invitations': { post: operation(['Institutions'], 'Invite first admin, instructor, or learner', { parameters: [id()], requestBody: body('InvitationBody'), responses: { 201: ok(), ...errors } }) },
  '/institutions/{id}/members': { get: operation(['Institutions'], 'List institution members', { parameters: [id(), ...paging, { name: 'role', in: 'query', schema: { type: 'string', enum: ['institution_admin', 'instructor', 'learner'] } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending_institution', 'invited', 'active', 'suspended'] } }, { name: 'search', in: 'query', schema: { type: 'string' } }] }) },

  '/courses/public': { get: { tags: ['Courses'], summary: 'Browse public course catalog', parameters: [...paging, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { 200: ok(), 422: errors[422] } } },
  '/courses': { post: operation(['Courses'], 'Create platform or instructor course', { requestBody: body('CourseBody'), responses: { 201: ok(), ...errors } }) },
  '/courses/{id}': { get: operation(['Courses'], 'Get accessible course', { parameters: [id()] }), patch: operation(['Courses'], 'Update owned course', { parameters: [id()], requestBody: body('CourseBody', false) }) },
  '/courses/{id}/publish': { post: operation(['Courses'], 'Publish owned course', { parameters: [id()] }) },
  '/courses/{id}/archive': { post: operation(['Courses'], 'Archive owned course', { parameters: [id()] }) },
  '/courses/{id}/request-publication': { post: operation(['Courses'], 'Request public catalog publication', { parameters: [id()] }) },
  '/courses/{id}/approve-publication': { post: operation(['Courses'], 'Approve institution course for public catalog', { parameters: [id()] }) },
  '/courses/{courseId}/modules': { post: operation(['Course Builder'], 'Add course module', { parameters: [id('courseId')], requestBody: body('ModuleBody'), responses: { 201: ok(), ...errors } }) },
  '/modules/{id}': { patch: operation(['Course Builder'], 'Update module', { parameters: [id()], requestBody: body('ModuleBody', false) }), delete: operation(['Course Builder'], 'Delete module and lessons', { parameters: [id(), { name: 'confirm', in: 'query', required: true, schema: { type: 'boolean' } }] }) },
  '/modules/{moduleId}/lessons': { post: operation(['Course Builder'], 'Add lesson', { parameters: [id('moduleId')], requestBody: body('LessonBody'), responses: { 201: ok(), ...errors } }) },
  '/lessons/{id}': { patch: operation(['Course Builder'], 'Update lesson', { parameters: [id()], requestBody: body('LessonBody', false) }), delete: operation(['Course Builder'], 'Delete lesson', { parameters: [id()] }) },

  '/courses/{id}/assign': { post: operation(['Learning'], 'Assign published course to institutional learner', { parameters: [id()], requestBody: body('AssignBody') }) },
  '/courses/{id}/enroll': { post: operation(['Learning'], 'Self-enroll in a free course', { parameters: [id()] }) },
  '/learner/courses': { get: operation(['Learning'], 'List current learner courses') },
  '/courses/{courseId}/lessons/{lessonId}': { get: operation(['Learning'], 'Get enrolled lesson', { parameters: [id('courseId'), id('lessonId')] }) },
  '/lessons/{id}/complete': { post: operation(['Learning'], 'Complete lesson and recalculate progress', { parameters: [id()] }) },
  '/learner/courses/{courseId}/progress': { get: operation(['Learning'], 'Get course progress', { parameters: [id('courseId')] }) },
  '/courses/{courseId}/assessments': { post: operation(['Assessments'], 'Create assessment', { parameters: [id('courseId')], requestBody: body('AssessmentBody'), responses: { 201: ok(), ...errors } }) },
  '/assessments/{id}': { get: operation(['Assessments'], 'Get assessment; answers hidden from learners', { parameters: [id()] }) },
  '/assessments/{id}/submit': { post: operation(['Assessments'], 'Submit assessment attempt', { parameters: [id()], requestBody: body('SubmitAssessmentBody'), responses: { 201: ok(), ...errors } }) },
  '/assessments/{id}/results/me': { get: operation(['Assessments'], 'Get own assessment attempts', { parameters: [id()] }) },

  '/courses/{id}/ai-tutor/ask': { post: operation(['AI Tutor'], 'Ask grounded AI Tutor', { parameters: [id()], requestBody: body('TutorQuestionBody'), responses: { 200: ok(), 429: { description: 'Per-learner rate limit exceeded' }, 503: { description: 'AI provider unavailable' }, ...errors } }) },
  '/courses/{id}/ai-tutor/history': { get: operation(['AI Tutor'], 'Get own AI Tutor history', { parameters: [id(), ...paging] }) },
  '/courses/{id}/checkout': { post: operation(['Payments'], 'Create Stripe Checkout for a paid public course', { parameters: [id()] }) },
  '/payments/create-intent': { post: operation(['Payments'], 'Create generic payment intent', { requestBody: body('CreatePaymentIntentBody'), responses: { 201: ok(), ...errors } }) },
  '/payments/my-payments': { get: operation(['Payments'], 'Get own payment history') },

  '/library': { get: operation(['Library'], 'Search visible library resources', { parameters: [...paging, { name: 'search', in: 'query', schema: { type: 'string' } }] }), post: operation(['Library'], 'Create scoped library resource', { requestBody: body('LibraryResourceBody'), responses: { 201: ok(), ...errors } }) },
  '/library/{id}': { patch: operation(['Library'], 'Update managed library resource', { parameters: [id()], requestBody: body('LibraryResourceBody', false) }), delete: operation(['Library'], 'Delete managed library resource', { parameters: [id()] }) },
  '/instructor/courses/{id}/analytics': { get: operation(['Analytics'], 'Get owned-course analytics', { parameters: [id()] }) },
  '/institutions/{id}/analytics': { get: operation(['Analytics'], 'Get institution analytics', { parameters: [id()] }) },
  '/learner/courses/{id}/summary': { get: operation(['Analytics'], 'Get learner course summary', { parameters: [id()] }) },

  '/media/image': { post: operation(['Media'], 'Upload image', { requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } } } }, responses: { 201: ok(), ...errors } }) },
  '/media/video': { post: operation(['Media'], 'Upload video', { requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['video'], properties: { video: { type: 'string', format: 'binary' } } } } } }, responses: { 201: ok(), ...errors } }) },
  '/health': { get: { tags: ['Health'], summary: 'Process health', security: [], servers: [{ url: env.SERVER_URL }], responses: { 200: ok() } } },
  '/ready': { get: { tags: ['Health'], summary: 'MongoDB readiness', security: [], servers: [{ url: env.SERVER_URL }], responses: { 200: ok(), 503: { description: 'Database unavailable' } } } },
  '/webhooks/stripe': { post: { tags: ['Webhooks'], summary: 'Stripe signed webhook (not suitable for manual Try it out)', security: [], servers: [{ url: env.SERVER_URL }], responses: { 200: { description: 'Event accepted' }, 400: errors[400] } } },
} as const;
