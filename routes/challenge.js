import express from "express";
const router = express.Router();
// Middleware
import * as commonMiddleware from "../middleware/commonMiddleware.js";
import * as challengeMiddleware from "../middleware/challengeMiddleware.js";
// Controllers
import * as challengeController from "../controllers/challengeController.js";

// API create a challenge
router.post(
    "/create",
    [commonMiddleware.authentication, commonMiddleware.checkEmptyData],
    challengeController.handleCreateChallenge
);
// API delete a challenge (soft-delete)
router.delete(
    "/:id",
    [
        commonMiddleware.authentication,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleDeleteChallenge
);
// API update a challenge
router.put(
    "/:id",
    [
        commonMiddleware.authentication,
        commonMiddleware.checkEmptyData,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleUpdateChallenge
);
// API search and filter challenges (public and private) - role: Creator
router.get(
    "/search",
    [
        commonMiddleware.authentication,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleSearchChallenges
);
// API detail a challenge and its questions
router.get(
    "/:id",
    [
        commonMiddleware.authentication,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleDetailOneChallenge
);
// API introduce a challenge (display maximum 3 questions)
router.get(
    "/introduce/:id",
    [
        commonMiddleware.authentication,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleIntroduceOneChallene
);
// API get result of a challenge
router.post(
    "/submit",
    [
        commonMiddleware.authentication,
        commonMiddleware.checkEmptyData,
        challengeMiddleware.checkChallengeExistent,
    ],
    challengeController.handleSumbitChallange
);

export default router;
