import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Lesson } from '../models/Lesson.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { User } from '../models/User.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt, AssessmentAttemptCounter } from '../models/AssessmentAttempt.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, UserStatus, type AuthenticatedUser } from '../types/index.js';
async function enrollment(learnerId: string, courseId: string) {
  const e = await Enrollment.findOne({ learnerId, courseId }).exec();
  if (e === null) throw new AppError('Active enrollment required', 403, 'ENROLLMENT_REQUIRED');
  return e;
}
export async function assign(actor: AuthenticatedUser, courseId: string, learnerId: string) {
  const course = await Course.findById(courseId).lean();
  if (course === null || course.status !== 'published')
    throw new AppError('Published course not found', 404, 'NOT_FOUND');
  const owns =
    (actor.role === UserRole.InstitutionAdmin &&
      course.institutionId?.equals(actor.institutionId)) ||
    (actor.role === UserRole.Instructor && course.instructorId?.equals(actor._id));
  if (!owns) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  const learner = await User.findOne({
    _id: learnerId,
    institutionId: course.institutionId,
    role: UserRole.Learner,
    status: UserStatus.Active,
  }).lean();
  if (learner === null) throw new AppError('Learner not found', 404, 'NOT_FOUND');
  return Enrollment.findOneAndUpdate(
    { courseId, learnerId },
    {
      $setOnInsert: {
        institutionId: course.institutionId,
        assignedBy: actor._id,
        source: 'assigned',
        enrolledAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}
export async function selfEnroll(actor: AuthenticatedUser, courseId: string) {
  const course = await Course.findById(courseId).lean();
  if (course === null || course.status !== 'published')
    throw new AppError('Course not found', 404, 'NOT_FOUND');
  const independent = actor.role === UserRole.IndependentLearner && course.visibility === 'public';
  const tenant =
    actor.role === UserRole.Learner &&
    course.institutionId?.equals(actor.institutionId) &&
    course.enrollmentMode === 'self_enroll';
  if (!independent && !tenant)
    throw new AppError('Self enrollment is not allowed', 403, 'FORBIDDEN');
  if ((course.priceAmount ?? 0) > 0)
    throw new AppError('Checkout is required', 402, 'PAYMENT_REQUIRED');
  return Enrollment.findOneAndUpdate(
    { courseId, learnerId: actor._id },
    {
      $setOnInsert: { institutionId: course.institutionId, source: 'self', enrolledAt: new Date() },
    },
    { upsert: true, new: true }
  );
}
export async function learnerCourses(actor: AuthenticatedUser) {
  return Enrollment.find({ learnerId: actor._id }).populate('courseId').lean();
}
export async function getLesson(actor: AuthenticatedUser, courseId: string, lessonId: string) {
  await enrollment(actor._id.toString(), courseId);
  const lesson = await Lesson.findOne({ _id: lessonId, courseId }).select('-plainTextForAI').lean();
  if (lesson === null) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  return lesson;
}
export async function completeLesson(actor: AuthenticatedUser, lessonId: string) {
  const lesson = await Lesson.findById(lessonId).lean();
  if (lesson === null) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  const e = await enrollment(actor._id.toString(), lesson.courseId.toString());
  await LessonProgress.findOneAndUpdate(
    { enrollmentId: e._id, lessonId },
    {
      $setOnInsert: {
        institutionId: lesson.institutionId,
        courseId: lesson.courseId,
        learnerId: actor._id,
        completedAt: new Date(),
      },
    },
    { upsert: true }
  );
  const [total, done] = await Promise.all([
    Lesson.countDocuments({ courseId: lesson.courseId }),
    LessonProgress.countDocuments({ enrollmentId: e._id }),
  ]);
  e.progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  e.status = e.progressPercent === 100 ? 'completed' : 'in_progress';
  if (e.status === 'completed') e.completedAt ??= new Date();
  await e.save();
  return e;
}
export async function progress(actor: AuthenticatedUser, courseId: string) {
  const e = await enrollment(actor._id.toString(), courseId);
  return { status: e.status, progressPercent: e.progressPercent };
}
export async function createAssessment(
  actor: AuthenticatedUser,
  courseId: string,
  input: Record<string, unknown>
) {
  const course = await Course.findById(courseId).lean();
  if (
    course === null ||
    actor.role !== UserRole.Instructor ||
    !course.instructorId?.equals(actor._id) ||
    !course.institutionId?.equals(actor.institutionId)
  )
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return Assessment.create({ ...input, courseId, institutionId: course.institutionId });
}
export async function getAssessment(actor: AuthenticatedUser, id: string) {
  const a = await Assessment.findById(id).lean();
  if (a === null) throw new AppError('Assessment not found', 404, 'NOT_FOUND');
  if (actor.role === UserRole.Learner || actor.role === UserRole.IndependentLearner) {
    await enrollment(actor._id.toString(), a.courseId.toString());
    return { ...a, questions: a.questions.map(({ correctOptionIndex: _correct, ...q }) => q) };
  }
  return a;
}
export async function submitAssessment(actor: AuthenticatedUser, id: string, answers: number[]) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const a = await Assessment.findById(id).session(session).exec();
      if (a === null) throw new AppError('Assessment not found', 404, 'NOT_FOUND');
      await Enrollment.findOne({ learnerId: actor._id, courseId: a.courseId })
        .session(session)
        .orFail(new AppError('Enrollment required', 403, 'ENROLLMENT_REQUIRED'));
      const used = await AssessmentAttempt.countDocuments({
        assessmentId: id,
        learnerId: actor._id,
      }).session(session);
      if (used >= a.maxAttempts)
        throw new AppError('Maximum attempts reached', 403, 'MAX_ATTEMPTS_REACHED');
      if (answers.length !== a.questions.length)
        throw new AppError('Answer count does not match question count', 422, 'INVALID_ANSWERS');
      const counter = await AssessmentAttemptCounter.findOneAndUpdate(
        { assessmentId: a._id, learnerId: actor._id },
        { $inc: { value: 1 } },
        { upsert: true, new: true, session }
      );
      if (counter === null) throw new AppError('Could not allocate attempt', 500);
      const correct = a.questions.reduce(
        (n, q, i) => n + (answers[i] === q.correctOptionIndex ? 1 : 0),
        0
      );
      const scorePercent = Math.round((correct / a.questions.length) * 100);
      try {
        return await new AssessmentAttempt({
          institutionId: a.institutionId,
          assessmentId: a._id,
          courseId: a.courseId,
          learnerId: actor._id,
          attemptNumber: counter.value,
          answers,
          scorePercent,
          passed: scorePercent >= a.passingScorePercent,
        }).save({ session });
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: number }).code === 11000
        )
          throw new AppError('Attempt already recorded', 409, 'ATTEMPT_ALREADY_RECORDED');
        throw error;
      }
    });
  } finally {
    await session.endSession();
  }
}
export async function myResults(actor: AuthenticatedUser, id: string) {
  return AssessmentAttempt.find({ assessmentId: id, learnerId: actor._id })
    .sort({ attemptNumber: 1 })
    .lean();
}
