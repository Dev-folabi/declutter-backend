import { Router } from 'express';
import { collectWaitlistEmail } from '../controllers/waitlistController';
import { validateWaitlist } from '../middlewares/validators';
import authRoute from '../routes/authRoute'

const router = Router();

router.post('/waitlist', validateWaitlist, collectWaitlistEmail);
router.use('/auth', authRoute)
export default router;
