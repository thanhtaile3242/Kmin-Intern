import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";

// Middleware
import {
    checkValidToken,
    checkEmptyData,
} from "../middleware/mcQuestionMiddleware.js";
import { checkChallengeExistent } from "../middleware/challengeMiddleware.js";
// Controllers
import {
    handleCreateChallenge,
    handleDeleteChallenge,
} from "../controllers/challengeController.js";
const router = express.Router();

// API create a challenge
router.post(
    "/create",
    [checkValidToken, checkEmptyData],
    handleCreateChallenge
);
// API delete a challenge (soft-delete)
router.delete(
    "/delete/:id",
    [checkValidToken, checkChallengeExistent],
    handleDeleteChallenge
);

export default router;
