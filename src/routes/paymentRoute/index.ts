import express from 'express';
import { getBankCodes, getAccountDetails } from '../../controllers/paymentController';

const router = express.Router();

router.get('/banks', getBankCodes);
router.get('/account-details', getAccountDetails);
export default router;
