import { Router } from 'express';
import { BillingController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createBillingRoutes(
  controller: BillingController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public endpoints
  router.get('/plans', controller.getPlans.bind(controller));
  router.get('/health', controller.healthCheck.bind(controller));

  // Webhook endpoint (no auth, uses signature verification)
  router.post('/webhook', controller.handleWebhook.bind(controller));

  // Protected endpoints
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // Subscription management
  router.post('/checkout', controller.createCheckoutSession.bind(controller));
  router.get('/subscription', controller.getSubscription.bind(controller));
  router.put('/subscription', controller.updateSubscription.bind(controller));
  router.delete('/subscription', controller.cancelSubscription.bind(controller));

  // Payment methods
  router.get('/payment-methods', controller.getPaymentMethods.bind(controller));
  router.post('/payment-methods', controller.addPaymentMethod.bind(controller));
  router.put('/payment-methods/:id', controller.updatePaymentMethod.bind(controller));
  router.delete('/payment-methods/:id', controller.removePaymentMethod.bind(controller));

  // Usage tracking
  router.get('/usage', controller.getUsageSummary.bind(controller));
  router.post('/usage', controller.trackUsage.bind(controller));

  // Invoices
  router.get('/invoices', controller.getInvoices.bind(controller));

  // Overview and previews
  router.get('/overview', controller.getBillingOverview.bind(controller));
  router.post('/preview-upgrade', controller.previewUpgrade.bind(controller));

  return router;
}