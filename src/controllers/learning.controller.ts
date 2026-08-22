import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import * as s from '../services/learning.service.js';
const a = (r: Request) => (r as AuthRequest).user;
const p = (r: Request, k: string) => String(r.params[k] ?? '');
export async function assign(r: Request, x: Response) {
  sendSuccess(x, 'Course assigned', await s.assign(a(r), p(r, 'id'), r.body.learnerId));
}
export async function enroll(r: Request, x: Response) {
  sendSuccess(x, 'Enrolled', await s.selfEnroll(a(r), p(r, 'id')));
}
export async function courses(r: Request, x: Response) {
  sendSuccess(x, 'Courses fetched', await s.learnerCourses(a(r)));
}
export async function lesson(r: Request, x: Response) {
  sendSuccess(x, 'Lesson fetched', await s.getLesson(a(r), p(r, 'courseId'), p(r, 'lessonId')));
}
export async function complete(r: Request, x: Response) {
  sendSuccess(x, 'Lesson completed', await s.completeLesson(a(r), p(r, 'id')));
}
export async function progress(r: Request, x: Response) {
  sendSuccess(x, 'Progress fetched', await s.progress(a(r), p(r, 'courseId')));
}
export async function createAssessment(r: Request, x: Response) {
  sendCreated(x, 'Assessment created', await s.createAssessment(a(r), p(r, 'courseId'), r.body));
}
export async function assessment(r: Request, x: Response) {
  sendSuccess(x, 'Assessment fetched', await s.getAssessment(a(r), p(r, 'id')));
}
export async function submit(r: Request, x: Response) {
  sendCreated(
    x,
    'Assessment submitted',
    await s.submitAssessment(a(r), p(r, 'id'), r.body.answers)
  );
}
export async function results(r: Request, x: Response) {
  sendSuccess(x, 'Results fetched', await s.myResults(a(r), p(r, 'id')));
}
