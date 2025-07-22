import { Router } from 'express';

import authRoute from '../routes/authRoute';
import waitlistRoute from '../routes/waitlistRoute';
import adminRoute from '../routes/authRoute/adminAuthRoute';
import userRoute from '../routes/userRoute';
import notificationsRoute from '../routes/notificationsRoute';
import productRoute from '../routes/productRoute';
import paymentRoute from '../routes/paymentRoute';
import weListenedRoute from '../routes/weListenedRoute';
import orderRoute from '../routes/orderRoute';
import cartRoute from '../routes/cartRoute';
import contactUsRoute from '../routes/contactUsRoute';
import userManagementRoute from '../routes/userManagementRoute';
import { verifyToken } from '../middlewares/authMiddleware';
const router = Router();

router.use('/waitlist', waitlistRoute);
router.use('/auth', authRoute);
router.use('/user', userRoute);
router.use('/notification', verifyToken, notificationsRoute);
router.use('/product', productRoute);
router.use('/order', verifyToken, orderRoute);
router.use('/cart', verifyToken, cartRoute);
router.use('/welistened', weListenedRoute);
router.use('/contactus', contactUsRoute);
router.use('/payment', paymentRoute);
router.use('/admin', adminRoute, userManagementRoute);

export default router;
