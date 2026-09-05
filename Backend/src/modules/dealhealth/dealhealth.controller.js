import * as dealHealthService from './dealhealth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getDealHealth = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Deal health data', await dealHealthService.getDealHealth()); } catch (e) { next(e); }
};
