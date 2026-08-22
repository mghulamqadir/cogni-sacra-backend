import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { CourseModule } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, type AuthenticatedUser } from '../types/index.js';

const clean = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
async function editableCourse(actor: AuthenticatedUser, id: string) {
  const course = await Course.findById(id).exec();
  if (course === null) throw new AppError('Course not found', 404, 'NOT_FOUND');
  const platformOwner = actor.role === UserRole.PlatformAdmin && course.institutionId == null;
  const instructorOwner =
    actor.role === UserRole.Instructor &&
    course.instructorId?.equals(actor._id) &&
    course.institutionId?.equals(actor.institutionId);
  if (!platformOwner && !instructorOwner) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return course;
}
export async function createCourse(actor: AuthenticatedUser, input: Record<string, unknown>) {
  if (![UserRole.PlatformAdmin, UserRole.Instructor].includes(actor.role))
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return Course.create({
    ...input,
    institutionId: actor.role === UserRole.Instructor ? actor.institutionId : undefined,
    instructorId: actor.role === UserRole.Instructor ? actor._id : undefined,
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
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Lesson.deleteMany({ moduleId: id }).session(session);
      await CourseModule.deleteOne({ _id: id }).session(session);
    });
  } finally {
    await session.endSession();
  }
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
  }
) {
  const module = await CourseModule.findById(moduleId).lean().exec();
  if (module === null) throw new AppError('Module not found', 404, 'NOT_FOUND');
  await editableCourse(actor, module.courseId.toString());
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
  lesson.set(input);
  const source = lesson.contentType === 'text' ? lesson.contentBody : lesson.aiContext;
  lesson.plainTextForAI = clean(source ?? '');
  return lesson.save();
}
export async function deleteLesson(actor: AuthenticatedUser, id: string) {
  const lesson = await Lesson.findById(id).lean();
  if (lesson === null) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  await editableCourse(actor, lesson.courseId.toString());
  await Lesson.deleteOne({ _id: id });
}
