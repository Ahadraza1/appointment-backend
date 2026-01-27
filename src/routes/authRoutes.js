import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { validateFields } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post("/register", validateFields(["name", "email", "phone", "password"]), registerUser);
router.post("/login", validateFields(["email", "password"]), loginUser);

export default router;
