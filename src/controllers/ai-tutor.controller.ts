import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import * as s from '../services/ai-tutor.service.js';
const a = (r: Request) => (r as AuthRequest).user;
export async function ask(r: Request, x: Response) {
  sendSuccess(
    x,
    'Tutor answer generated',
    await s.ask(a(r), String(r.params['id']), r.body.question)
  );
}
export async function history(r: Request, x: Response) {
  sendSuccess(
    x,
    'Tutor history fetched',
    await s.history(
      a(r),
      String(r.params['id']),
      Number(r.query['page'] ?? 1),
      Number(r.query['limit'] ?? 20)
    )
  );
}
