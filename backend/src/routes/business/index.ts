import express from 'express';
import purchaseOrdersRoutes from './purchaseOrders';
import agreementsRoutes from './agreements';
import slaFundsRoutes from './slaFunds';

const router = express.Router();

// Register all business routes
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/agreements', agreementsRoutes);
router.use('/sla-funds', slaFundsRoutes);

export default router; 