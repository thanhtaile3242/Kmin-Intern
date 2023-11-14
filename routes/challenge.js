import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilterChallenge,
    removeSpecialCharactersAndTrim,
    countMatching,
} from "../utils/utils_MCQ.js";
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
    handleSearchAndFilterChallenge,
    handleUpdateChallenge,
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
// API search and filter challenges
router.get("/search", [checkValidToken], handleSearchAndFilterChallenge);
// API update challenge
router.put(
    "/edit/:id",
    [checkValidToken, checkEmptyData],
    handleUpdateChallenge
);

export default router;
