import express from "express";
// Controller
import { handleSignUp, handleSignIn } from "../controllers/userController.js";
// Middleware
import {
    validateUserSignUp,
    checkExistentAccount,
    validateUserSignIn,
    checkSpecialCharactersInUsername,
} from "../middleware/userMiddleware.js";
const router = express.Router();
// API sign up
router.post(
    "/signup",
    [
        validateUserSignUp,
        checkSpecialCharactersInUsername,
        checkExistentAccount,
    ],
    handleSignUp
);
// API sign in
router.post("/signin", validateUserSignIn, handleSignIn);

export default router;
