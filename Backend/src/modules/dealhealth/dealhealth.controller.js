import * as service from './dealhealth.service.js';

export const getDealHealth = async (req, res, next) => {
  try {
    const data = await service.getDealHealth();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const triggerNudge = async (req, res, next) => {
  try {
    const result = await service.triggerNudge(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const triggerEscalation = async (req, res, next) => {
  try {
    const result = await service.triggerEscalation(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const triggerExpedite = async (req, res, next) => {
  try {
    const result = await service.triggerExpedite(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
