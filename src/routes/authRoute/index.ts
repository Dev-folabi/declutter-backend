import express from "express";
import {
  validateAddSchoolsBulk,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateResetPasswordOTP,
} from "../../middlewares/validators";
import {
  addSchoolsBulk,
  getSchools,
  loginUser,
  registerUser,
  resetPasswordOTP,
  resetPassword,
} from "../../controllers/authController";

const router = express.Router();

router.post("/school", validateAddSchoolsBulk, addSchoolsBulk);
router.get("/schools", getSchools);

router.post("/signup", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/reset-password-otp", validateResetPasswordOTP, resetPasswordOTP);
router.post("/reset-password", validateResetPassword, resetPassword);

export default router;
