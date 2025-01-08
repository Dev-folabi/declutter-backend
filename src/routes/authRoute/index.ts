import express from "express";
import { validateLogin, validateRegister } from "../../middlewares/validators";
import { loginUser, registerUser } from "../../controllers/authController";

const router = express.Router();

router.post("/", validateRegister, registerUser);
router.post("/", validateLogin, loginUser);

export default router;
