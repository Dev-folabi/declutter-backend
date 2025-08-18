import { Router } from 'express';
import authRoute from '../routes/authRoute';
import waitlistRoute from '../routes/waitlistRoute';
import adminAuthRoute from './adminRoute/adminAuth';
import userRoute from '../routes/userRoute';
import notificationsRoute from '../routes/notificationsRoute';
import productRoute from '../routes/productRoute';
import paymentRoute from '../routes/paymentRoute';
import weListenedRoute from '../routes/weListenedRoute';
import transactionRoute from '../routes/transactionRoute';
import orderRoute from '../routes/orderRoute';
import cartRoute from '../routes/cartRoute';
import contactUsRoute from '../routes/contactUsRoute';
import userManagementRoute from './adminRoute/userManagement';
import productManagementRoute from '../routes/adminRoute/productManagementRoute';
import { verifyToken } from '../middlewares/authMiddleware';
const router = Router();

const adminRouter = Router();
adminRouter.use('/auth', adminAuthRoute);
adminRouter.use('/users', verifyToken, userManagementRoute);
adminRouter.use('/product', verifyToken, productManagementRoute);


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
router.use('/transactions', verifyToken, transactionRoute);
router.use("/admin", adminRouter);

export default router;
