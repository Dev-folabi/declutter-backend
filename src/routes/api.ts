import { Router } from "express";

import authRoute from "../routes/authRoute";
import waitlistRoute from "../routes/waitlistRoute";
import userRoute from "../routes/userRoute";
const router = Router();

router.use("/waitlist", waitlistRoute);
router.use("/auth", authRoute);
router.use("/user", userRoute);
export default router;
