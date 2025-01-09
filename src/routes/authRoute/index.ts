import express from "express";
import { validateAddSchoolsBulk, validateLogin, validateRegister } from "../../middlewares/validators";
import { addSchoolsBulk, getSchools, loginUser, registerUser } from "../../controllers/authController";

const router = express.Router();

router.post("/school", validateAddSchoolsBulk, addSchoolsBulk);
router.get("/schools", getSchools);

router.post("/signup", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);

export default router;
