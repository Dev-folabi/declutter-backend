import { Router } from "express";

import authRoute from "../routes/authRoute";
import waitlistRoute from "../routes/waitlistRoute";
import userRoute from "../routes/userRoute";
import notificationsRoute from "../routes/notificationsRoute";
import productRoute from "../routes/productRoute";
import paymentRoute from "../routes/paymentRoute"
import weListenedRoute from "../routes/weListenedRoute"
import orderRoute from "../routes/orderRoute"
import cartRoute from "../routes/cartRoute"
import contactUsRoute from "../routes/contactUsRoute"
const router = Router();

router.use("/waitlist", waitlistRoute);
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/notification", notificationsRoute);
router.use("/product", productRoute);
router.use("/order", orderRoute);
router.use("/cart", cartRoute);
router.use("/welistened", weListenedRoute);
router.use("/contactus", contactUsRoute);
router.use('/payment', paymentRoute);


export default router;
