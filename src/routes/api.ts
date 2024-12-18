import { Router } from 'express';
import { collectWaitlistEmail } from '../controllers/waitlistController';
import { validateWaitlist } from '../middlewares/validators';


const router = Router();

router.post('/waitlist', validateWaitlist, collectWaitlistEmail);

export default router;
