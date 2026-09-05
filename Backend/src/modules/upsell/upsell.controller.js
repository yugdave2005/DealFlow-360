import * as upsellService from './upsell.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getSuggestions = async (req, res, next) => {
  try {
    const lineItems = req.body?.lineItems || (req.query?.lineItems ? JSON.parse(req.query.lineItems) : []);
    const suggestions = await upsellService.getSuggestions(lineItems);
    sendSuccess(res, 200, 'Upsell/cross-sell suggestions', suggestions);
  } catch (err) {
    next(err);
  }
};
