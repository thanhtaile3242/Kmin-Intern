import express from "express";
import { handleSignUp, handleSignIn } from "../controllers/userController.js";
import {
    validateUserSignUp,
    checkExistentAccount,
    validateUserSignIn,
} from "../middleware/userMiddleware.js";
const router = express.Router();
// API sign up
router.post(
    "/signup",
    [validateUserSignUp, checkExistentAccount],
    handleSignUp
);
router.post("/signin", validateUserSignIn, handleSignIn);

export default router;
