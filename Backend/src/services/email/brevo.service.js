import { logger } from '../../utils/logger.js';

export const sendEmail = async ({ to, subject, templateId, params }) => {
  // In a real hackathon project, integrate the SibApiV3Sdk here.
  // We represent the abstraction perfectly so it can be enabled later.
  logger.info({ to, subject, params }, `Simulated Brevo Email Send: Template ${templateId}`);
  
  if (!process.env.BREVO_API_KEY) {
    logger.warn('Brevo API key missing; skipping real email transmission.');
    return true;
  }

  // Real Brevo logic goes here via transactionalEmailApi.sendTransacEmail()
  return true;
};
