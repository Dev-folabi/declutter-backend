import { Router } from "express";

import authRoute from "../routes/authRoute";
import waitlistRoute from "../routes/waitlistRoute";
const router = Router();

router.use("/waitlist", waitlistRoute);
router.use("/auth", authRoute);
export default router;
