import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import * as service from '../services/institution.service.js';

const actor = (req: Request) => (req as AuthRequest).user;
const id = (req: Request): string => String(req.params['id'] ?? '');
export async function create(req: Request, res: Response) {
  sendCreated(
    res,
    'Institution created',
    await service.createInstitution(actor(req), req.body, req.id)
  );
}
export async function approve(req: Request, res: Response) {
  sendSuccess(
    res,
    'Institution approved',
    await service.approveInstitution(actor(req), id(req), req.id)
  );
}
export async function get(req: Request, res: Response) {
  sendSuccess(res, 'Institution fetched', await service.getInstitution(actor(req), id(req)));
}
export async function invite(req: Request, res: Response) {
  sendCreated(
    res,
    'Invitation sent',
    await service.inviteMember(actor(req), id(req), req.body, req.id)
  );
}
export async function members(req: Request, res: Response) {
  sendSuccess(
    res,
    'Members fetched',
    await service.listMembers(actor(req), id(req), req.query as never)
  );
}
