import * as dealHealthService from './dealhealth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getDealHealth = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Deal health data', await dealHealthService.getDealHealth()); } catch (e) { next(e); }
};

export const escalateIssue = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Issue escalated successfully', await dealHealthService.escalateIssue(req.body)); } catch (e) { next(e); }
};
