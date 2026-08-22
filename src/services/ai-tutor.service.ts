import { Course } from '../models/Course.js';
import { CourseModule } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { AiTutorMessage } from '../models/AiTutorMessage.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { aiProvider } from './ai/ai.provider.js';
import type { AuthenticatedUser } from '../types/index.js';
export async function ask(actor: AuthenticatedUser, courseId: string, question: string) {
  const [course, enrollment] = await Promise.all([
    Course.findOne({ _id: courseId, status: 'published' }).lean(),
    Enrollment.findOne({ courseId, learnerId: actor._id }).lean(),
  ]);
  if (course === null || enrollment === null)
    throw new AppError('Published course enrollment required', 403, 'ENROLLMENT_REQUIRED');
  const modules = await CourseModule.find({ courseId }).sort({ order: 1 }).lean();
  const order = new Map(modules.map((m, i) => [m._id.toString(), i]));
  const lessons = await Lesson.find({ courseId }).lean();
  lessons.sort(
    (a, b) =>
      (order.get(a.moduleId.toString()) ?? 0) - (order.get(b.moduleId.toString()) ?? 0) ||
      a.order - b.order
  );
  let used = 0;
  const included: typeof lessons = [];
  for (const lesson of lessons) {
    const chunk = `<lesson id="${lesson._id}" title="${lesson.title}">\n${lesson.plainTextForAI}\n</lesson>`;
    const estimate = Math.ceil(chunk.length / 4);
    if (used + estimate > env.AI_TUTOR_MAX_CONTEXT_TOKENS) break;
    used += estimate;
    included.push(lesson);
  }
  const material = `<course_material>\n${included.map((l) => `<lesson id="${l._id}" title="${l.title}">\n${l.plainTextForAI}\n</lesson>`).join('\n')}\n</course_material>`;
  const allowed = new Set(included.map((l) => l._id.toString()));
  const started = Date.now();
  const result = await aiProvider().generateTutorAnswer({
    question,
    courseMaterial: material,
    allowedLessonIds: [...allowed],
  });
  const cited = result.citedLessonIds.filter((id) => allowed.has(id));
  const message = await AiTutorMessage.create({
    institutionId: course.institutionId,
    courseId,
    learnerId: actor._id,
    question,
    answer: result.answer,
    grounded: result.grounded && cited.length > 0,
    citedLessonIds: cited,
    model: env.AI_MODEL,
    latencyMs: Date.now() - started,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });
  const titles = new Map(included.map((l) => [l._id.toString(), l.title]));
  return {
    answer: message.answer,
    grounded: message.grounded,
    sources: cited.map((lessonId) => ({ lessonId, title: titles.get(lessonId) })),
  };
}
export async function history(
  actor: AuthenticatedUser,
  courseId: string,
  page: number,
  limit: number
) {
  if (!(await Enrollment.exists({ courseId, learnerId: actor._id })))
    throw new AppError('Enrollment required', 403, 'ENROLLMENT_REQUIRED');
  const filter = { courseId, learnerId: actor._id };
  const [messages, total] = await Promise.all([
    AiTutorMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AiTutorMessage.countDocuments(filter),
  ]);
  return { messages, total, page, totalPages: Math.ceil(total / limit) };
}
