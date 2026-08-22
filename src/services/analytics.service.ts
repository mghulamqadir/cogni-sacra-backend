import { Types } from 'mongoose';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Lesson } from '../models/Lesson.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, UserStatus, type AuthenticatedUser } from '../types/index.js';
export async function courseAnalytics(actor: AuthenticatedUser, id: string) {
  const c = await Course.findById(id).lean();
  if (c === null || actor.role !== UserRole.Instructor || !c.instructorId?.equals(actor._id))
    throw new AppError('Course not found', 404, 'NOT_FOUND');
  const [e, lessons, attempts] = await Promise.all([
    Enrollment.find({ courseId: id }).lean(),
    Lesson.find({ courseId: id }).select('_id title').lean(),
    AssessmentAttempt.find({ courseId: id }).lean(),
  ]);
  const avg = e.length ? e.reduce((n, x) => n + x.progressPercent, 0) / e.length : 0;
  const breakdown = await Promise.all(
    lessons.map(async (l) => ({
      lessonId: l._id,
      title: l.title,
      completionCount: await LessonProgress.countDocuments({ courseId: id, lessonId: l._id }),
    }))
  );
  return {
    enrollmentCount: e.length,
    averageProgressPercent: avg,
    completionRatePercent: e.length
      ? (e.filter((x) => x.status === 'completed').length / e.length) * 100
      : 0,
    averageAssessmentScorePercent: attempts.length
      ? attempts.reduce((n, x) => n + x.scorePercent, 0) / attempts.length
      : 0,
    lessonCompletionBreakdown: breakdown,
  };
}
export async function institutionAnalytics(actor: AuthenticatedUser, id: string) {
  if (actor.role !== UserRole.PlatformAdmin && actor.institutionId?.toString() !== id)
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  const institutionId = new Types.ObjectId(id);
  const [courses, activeLearners, enrollments, attempts] = await Promise.all([
    Course.find({ institutionId }).lean(),
    User.countDocuments({ institutionId, role: UserRole.Learner, status: UserStatus.Active }),
    Enrollment.find({ institutionId }).lean(),
    AssessmentAttempt.find({ institutionId }).lean(),
  ]);
  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'published').length,
    activeLearners,
    totalEnrollments: enrollments.length,
    averageLearnerProgress: enrollments.length
      ? enrollments.reduce((n, e) => n + e.progressPercent, 0) / enrollments.length
      : 0,
    completionRate: enrollments.length
      ? (enrollments.filter((e) => e.status === 'completed').length / enrollments.length) * 100
      : 0,
    assessmentPerformance: attempts.length
      ? attempts.reduce((n, a) => n + a.scorePercent, 0) / attempts.length
      : 0,
  };
}
export async function learnerSummary(actor: AuthenticatedUser, courseId: string) {
  const e = await Enrollment.findOne({ courseId, learnerId: actor._id }).lean();
  if (e === null) throw new AppError('Enrollment required', 403, 'ENROLLMENT_REQUIRED');
  const [completed, total, assessments] = await Promise.all([
    LessonProgress.countDocuments({ enrollmentId: e._id }),
    Lesson.countDocuments({ courseId }),
    Assessment.find({ courseId }).lean(),
  ]);
  const results = await Promise.all(
    assessments.map(async (a) => {
      const attempts = await AssessmentAttempt.find({ assessmentId: a._id, learnerId: actor._id })
        .sort({ attemptNumber: -1 })
        .lean();
      return {
        assessmentId: a._id,
        title: a.title,
        attemptsUsed: attempts.length,
        maxAttempts: a.maxAttempts,
        latestScorePercent: attempts[0]?.scorePercent ?? null,
        passed: attempts[0]?.passed ?? false,
      };
    })
  );
  return {
    progressPercent: e.progressPercent,
    completedLessons: completed,
    totalLessons: total,
    courseStatus: e.status,
    assessments: results,
  };
}
