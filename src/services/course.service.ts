import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { CourseModule } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, type AuthenticatedUser } from '../types/index.js';
import { deleteMedia } from './media.service.js';
import { logger } from '../utils/logger.js';

const clean = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function assertVideoKeyBelongsToActor(actor: AuthenticatedUser, mediaKey: unknown): void {
  if (
    typeof mediaKey !== 'string' ||
    !mediaKey.startsWith(`cogni-sacra/videos/${actor._id.toString()}/`)
  )
    throw new AppError('Invalid video media key', 400, 'INVALID_MEDIA_KEY');
}

async function removeVideoAsset(mediaKey: string | undefined): Promise<void> {
  if (!mediaKey) return;
  try {
    await deleteMedia(mediaKey, 'video');
  } catch (error) {
    // The lesson has already been safely updated/deleted. Keep the request
    // successful and log the orphan for an operational cleanup job.
    logger.error('Failed to delete replaced video asset', { mediaKey, error });
  }
}
async function editableCourse(actor: AuthenticatedUser, id: string) {
  const course = await Course.findById(id).exec();
  if (course === null) throw new AppError('Course not found', 404, 'NOT_FOUND');
  const platformOwner = actor.role === UserRole.PlatformAdmin && course.institutionId == null;
  const independentOwner =
    actor.role === UserRole.IndependentInstructor &&
    course.institutionId == null &&
    course.instructorId?.equals(actor._id);
  const instructorOwner =
    actor.role === UserRole.Instructor &&
    course.instructorId?.equals(actor._id) &&
    course.institutionId?.equals(actor.institutionId);
  if (!platformOwner && !instructorOwner && !independentOwner)
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return course;
}
export async function createCourse(actor: AuthenticatedUser, input: Record<string, unknown>) {
  if (![UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor].includes(actor.role))
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return Course.create({
    ...input,
    institutionId: actor.role === UserRole.Instructor ? actor.institutionId : undefined,
    instructorId: [UserRole.Instructor, UserRole.IndependentInstructor].includes(actor.role)
      ? actor._id
      : undefined,
    createdBy: actor._id,
  });
}
export async function updateCourse(
  actor: AuthenticatedUser,
  id: string,
  input: Record<string, unknown>
) {
  const course = await editableCourse(actor, id);
  course.set(input);
  return course.save();
}
export async function getCourse(actor: AuthenticatedUser | undefined, id: string) {
  const course = await Course.findById(id).lean().exec();
  if (course === null) throw new AppError('Course not found', 404, 'NOT_FOUND');
  if (course.visibility === 'public' && course.status === 'published') return course;
  if (
    actor?.role === UserRole.PlatformAdmin ||
    (actor?.role === UserRole.IndependentInstructor && course.createdBy.equals(actor._id)) ||
    (actor?.institutionId != null && course.institutionId?.equals(actor.institutionId))
  )
    return course;
  throw new AppError('Course not found', 404, 'NOT_FOUND');
}
export async function publishCourse(actor: AuthenticatedUser, id: string) {
  const course = await editableCourse(actor, id);
  const [modules, lessons] = await Promise.all([
    CourseModule.countDocuments({ courseId: id }),
    Lesson.countDocuments({ courseId: id }),
  ]);
  if (modules < 1 || lessons < 1)
    throw new AppError(
      'A course requires at least one module and lesson',
      422,
      'COURSE_INCOMPLETE'
    );
  course.status = 'published';
  if (actor.role === UserRole.IndependentInstructor && course.institutionId == null)
    course.visibility = 'public';
  course.publishedAt ??= new Date();
  return course.save();
}
export async function archiveCourse(actor: AuthenticatedUser, id: string) {
  const course = await editableCourse(actor, id);
  course.status = 'archived';
  return course.save();
}
export async function requestPublic(actor: AuthenticatedUser, id: string) {
  const course = await editableCourse(actor, id);
  if (course.institutionId == null) {
    course.visibility = 'public';
  } else {
    course.visibility = 'public_requested';
  }
  return course.save();
}
export async function approvePublic(actor: AuthenticatedUser, id: string) {
  const course = await Course.findOne({
    _id: id,
    institutionId: actor.institutionId,
    visibility: 'public_requested',
  }).exec();
  if (actor.role !== UserRole.InstitutionAdmin || course === null)
    throw new AppError('Course not found or forbidden', 404, 'NOT_FOUND');
  course.visibility = 'public';
  course.publicApprovedBy = actor._id;
  return course.save();
}
export async function publicCatalog(query: { page: number; limit: number; search?: string }) {
  const filter: Record<string, unknown> = { visibility: 'public', status: 'published' };
  if (query.search) filter.$text = { $search: query.search };
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('-createdBy -publicApprovedBy')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Course.countDocuments(filter),
  ]);
  return { courses, total, page: query.page, totalPages: Math.ceil(total / query.limit) };
}
export async function addModule(
  actor: AuthenticatedUser,
  courseId: string,
  input: { title: string; order: number }
) {
  const course = await editableCourse(actor, courseId);
  return CourseModule.create({ ...input, courseId, institutionId: course.institutionId });
}
export async function updateModule(
  actor: AuthenticatedUser,
  id: string,
  input: Record<string, unknown>
) {
  const module = await CourseModule.findById(id).exec();
  if (module === null) throw new AppError('Module not found', 404, 'NOT_FOUND');
  await editableCourse(actor, module.courseId.toString());
  module.set(input);
  return module.save();
}
export async function deleteModule(actor: AuthenticatedUser, id: string, confirm: boolean) {
  if (!confirm)
    throw new AppError('Explicit confirmation is required', 422, 'CONFIRMATION_REQUIRED');
  const module = await CourseModule.findById(id).exec();
  if (module === null) throw new AppError('Module not found', 404, 'NOT_FOUND');
  await editableCourse(actor, module.courseId.toString());
  const videoKeys = (await Lesson.find({ moduleId: id }).select('mediaKey').lean())
    .map((lesson) => lesson.mediaKey)
    .filter((key): key is string => typeof key === 'string');
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Lesson.deleteMany({ moduleId: id }).session(session);
      await CourseModule.deleteOne({ _id: id }).session(session);
    });
  } finally {
    await session.endSession();
  }
  await Promise.all(videoKeys.map((key) => removeVideoAsset(key)));
}
export async function addLesson(
  actor: AuthenticatedUser,
  moduleId: string,
  input: {
    title: string;
    order: number;
    contentType: 'text' | 'video' | 'link';
    contentBody?: string;
    contentUrl?: string;
    aiContext?: string;
    mediaKey?: string;
  }
) {
  const module = await CourseModule.findById(moduleId).lean().exec();
  if (module === null) throw new AppError('Module not found', 404, 'NOT_FOUND');
  await editableCourse(actor, module.courseId.toString());
  if (input.contentType === 'video' && input.mediaKey !== undefined)
    assertVideoKeyBelongsToActor(actor, input.mediaKey);
  const source = input.contentType === 'text' ? input.contentBody : input.aiContext;
  return Lesson.create({
    ...input,
    moduleId,
    courseId: module.courseId,
    institutionId: module.institutionId,
    plainTextForAI: clean(source ?? ''),
  });
}
export async function updateLesson(
  actor: AuthenticatedUser,
  id: string,
  input: Record<string, unknown>
) {
  const lesson = await Lesson.findById(id).exec();
  if (lesson === null) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  await editableCourse(actor, lesson.courseId.toString());
  const oldMediaKey = lesson.mediaKey;
  const oldContentUrl = lesson.contentUrl;
  lesson.set(input);
  if (lesson.contentType === 'video' && lesson.mediaKey !== undefined)
    assertVideoKeyBelongsToActor(actor, lesson.mediaKey);
  if (lesson.contentType === 'video' && oldMediaKey && input.contentUrl !== undefined && input.contentUrl !== oldContentUrl && input.mediaKey === undefined)
    throw new AppError('mediaKey is required when replacing a video', 422, 'MEDIA_KEY_REQUIRED');
  if (lesson.contentType !== 'video') lesson.mediaKey = undefined;
  const source = lesson.contentType === 'text' ? lesson.contentBody : lesson.aiContext;
  lesson.plainTextForAI = clean(source ?? '');
  const saved = await lesson.save();
  if (oldMediaKey && oldMediaKey !== saved.mediaKey) await removeVideoAsset(oldMediaKey);
  return saved;
}
export async function deleteLesson(actor: AuthenticatedUser, id: string) {
  const lesson = await Lesson.findById(id).lean();
  if (lesson === null) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  await editableCourse(actor, lesson.courseId.toString());
  await Lesson.deleteOne({ _id: id });
  await removeVideoAsset(lesson.mediaKey);
}
