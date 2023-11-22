import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilterChallenge,
    removeSpecialCharactersAndTrim,
    countMatching,
    arraysEqual,
    challengeResult,
} from "../utils/utils.js";
// Middleware
import {
    checkValidToken,
    checkEmptyData,
} from "../middleware/mcQuestionMiddleware.js";
//
import { checkChallengeExistent } from "../middleware/challengeMiddleware.js";
// Controllers
import {
    handleCreateChallenge,
    handleDeleteChallenge,
    handleSearchChallenges,
    handleUpdateChallenge,
    handleDetailOneChallenge,
    handleIntroduceOneChallene,
    handleSumbitChallange,
} from "../controllers/challengeController.js";

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
// API search and filter challenges (public and private)
router.get("/searchCreator", [checkValidToken], handleSearchChallenges);

// API update a challenge
router.put(
    "/edit/:id",
    [checkValidToken, checkEmptyData],
    handleUpdateChallenge
);
// API detail a challenge and its questions
router.get("/:id", [checkValidToken], handleDetailOneChallenge);

// API introduce a challenge (display maximum 3 questions)
router.get("/introduce/:id", [checkValidToken], handleIntroduceOneChallene);

// API get result of a challenge
router.post(
    "/submit",
    [checkValidToken, checkEmptyData],
    handleSumbitChallange
);

export default router;
