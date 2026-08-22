import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import * as s from '../services/course.service.js';
const actor = (r: Request) => (r as AuthRequest).user;
const p = (r: Request, k: string) => String(r.params[k] ?? '');
export async function create(r: Request, x: Response) {
  sendCreated(x, 'Course created', await s.createCourse(actor(r), r.body));
}
export async function get(r: Request, x: Response) {
  sendSuccess(x, 'Course fetched', await s.getCourse((r as Partial<AuthRequest>).user, p(r, 'id')));
}
export async function update(r: Request, x: Response) {
  sendSuccess(x, 'Course updated', await s.updateCourse(actor(r), p(r, 'id'), r.body));
}
export async function publish(r: Request, x: Response) {
  sendSuccess(x, 'Course published', await s.publishCourse(actor(r), p(r, 'id')));
}
export async function archive(r: Request, x: Response) {
  sendSuccess(x, 'Course archived', await s.archiveCourse(actor(r), p(r, 'id')));
}
export async function requestPublic(r: Request, x: Response) {
  sendSuccess(x, 'Public publication requested', await s.requestPublic(actor(r), p(r, 'id')));
}
export async function approvePublic(r: Request, x: Response) {
  sendSuccess(x, 'Public publication approved', await s.approvePublic(actor(r), p(r, 'id')));
}
export async function catalog(r: Request, x: Response) {
  sendSuccess(x, 'Public courses fetched', await s.publicCatalog(r.query as never));
}
export async function addModule(r: Request, x: Response) {
  sendCreated(x, 'Module created', await s.addModule(actor(r), p(r, 'courseId'), r.body));
}
export async function updateModule(r: Request, x: Response) {
  sendSuccess(x, 'Module updated', await s.updateModule(actor(r), p(r, 'id'), r.body));
}
export async function deleteModule(r: Request, x: Response) {
  await s.deleteModule(actor(r), p(r, 'id'), r.query['confirm'] === 'true');
  sendSuccess(x, 'Module deleted');
}
export async function addLesson(r: Request, x: Response) {
  sendCreated(x, 'Lesson created', await s.addLesson(actor(r), p(r, 'moduleId'), r.body));
}
export async function updateLesson(r: Request, x: Response) {
  sendSuccess(x, 'Lesson updated', await s.updateLesson(actor(r), p(r, 'id'), r.body));
}
export async function deleteLesson(r: Request, x: Response) {
  await s.deleteLesson(actor(r), p(r, 'id'));
  sendSuccess(x, 'Lesson deleted');
}
