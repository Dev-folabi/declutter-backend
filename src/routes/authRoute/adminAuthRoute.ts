import express from "express";
import { 
registerAdmin,
loginAdmin,
verifyAdminEmail,
resetAdminPasswordOTP,
resetAdminPassword
} from "../../controllers/admin/authController";

import {
validateAdminRegister, 
validateLogin, validateVerifyEmailOTP, 
validateResetPassword, 
validateResetPasswordOTP
} from "../../middlewares/validators";
// import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware";
const router = express.Router();


// Admin-only routes
router.post("/signup",validateAdminRegister, registerAdmin);
router.post("/login",validateLogin, loginAdmin);
router.post("/reset-password-otp", validateResetPasswordOTP, resetAdminPasswordOTP);
router.post("/reset-password", validateResetPassword, resetAdminPassword);
router.post("/verify-otp", validateVerifyEmailOTP, verifyAdminEmail);


export default router