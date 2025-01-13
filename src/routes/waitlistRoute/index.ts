import express from "express";
import {
  collectWaitlistEmail,
  sendWaitlistMessage,
} from "../../controllers/waitlistController";
import { validateWaitlist } from "../../middlewares/validators";

const router = express.Router();

router.post("/", validateWaitlist, collectWaitlistEmail);
router.post("/message", sendWaitlistMessage);

export default router;
