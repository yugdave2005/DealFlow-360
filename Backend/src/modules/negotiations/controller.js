import * as negotiationService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const getByVersion = async (req, res, next) => {
  try {
    const data = await negotiationService.getMessagesByVersion(req.params.versionId);
    sendSuccess(res, 200, 'Negotiation messages fetched', data);
  } catch (e) { next(e); }
};

export const getByQuotation = async (req, res, next) => {
  try {
    const data = await negotiationService.getMessagesByQuotation(req.params.quotationId);
    sendSuccess(res, 200, 'Negotiation messages fetched', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = await negotiationService.createMessage(req.body);
    sendSuccess(res, 201, 'Message created', data);
  } catch (e) { next(e); }
};
