import express from "express";
import db from "../models/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/sendMail.js";
const router = express.Router();
// Controller
import * as userController from "../controllers/userController.js";
// Middleware
import * as userMiddleware from "../middleware/userMiddleware.js";

// API sign up
router.post(
    "/signup",
    [
        userMiddleware.validateUserSignUp,
        userMiddleware.checkSpecialCharactersInUsername,
        userMiddleware.checkExistentAccount,
    ],
    userController.handleSignUp
);
// API sign in
router.post(
    "/signin",
    [userMiddleware.validateUserSignIn],
    userController.handleSignIn
);

export default router;
