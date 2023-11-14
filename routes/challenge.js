import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Controller
import { handleSignUp, handleSignIn } from "../controllers/userController.js";
// Middleware
import {
    checkValidToken,
    checkEmptyData,
} from "../middleware/mcQuestionMiddleware.js";
// Controllers
import { handleCreateChallenge } from "../controllers/challengeController.js";
const router = express.Router();

// API create a challenge
router.post(
    "/create",
    [checkValidToken, checkEmptyData],
    handleCreateChallenge
);

export default router;
