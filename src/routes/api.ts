import { Router } from "express";

import authRoute from "../routes/authRoute";
import waitlistRoute from "../routes/waitlistRoute";
import userRoute from "../routes/userRoute";
import notificationsRoute from "../routes/notificationsRoute";
import productRoute from "../routes/productRoute";
const router = Router();

router.use("/waitlist", waitlistRoute);
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/notification", notificationsRoute);
router.use("/product", productRoute);
export default router;
