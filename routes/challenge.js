import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
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
import { checkChallengeExistent } from "../middleware/challengeMiddleware.js";
// Controllers
import {
    handleCreateChallenge,
    handleDeleteChallenge,
    handleSearchAndFilterChallenge,
    handleUpdateChallenge,
    handleDetailOneChallenge,
    handleIntroduceOneChallene,
    handleSumbitChallange,
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

// API TEST
function checkFields(requiredFields) {
    return function (req, res, next) {
        const requestData = req.body;

        if (!Array.isArray(requestData)) {
            return res
                .status(400)
                .json({ error: "Invalid data format. Expected an array." });
        }

        for (const obj of requestData) {
            for (const field of requiredFields) {
                if (!checkFieldInObject(field, obj)) {
                    return res.status(400).json({
                        error: `Missing '${field}' field in one or more objects.`,
                    });
                }
            }
        }

        next();
    };
}

function checkFieldInObject(field, obj) {
    if (obj.hasOwnProperty(field)) {
        if (Array.isArray(obj[field])) {
            for (const subObj of obj[field]) {
                if (!checkFieldInObject(field, subObj)) {
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}

// Usage example
const requiredFields = [
    "uid",
    "name",
    "description",
    "aUID",
    "noidung",
    "correct",
    "order",
];

// Use the middleware with the required fields
router.post("/test", checkFields(requiredFields), (req, res) => {
    const validatedData = req.body;
    res.status(200).json({
        message: "Data validated successfully.",
        data: validatedData,
    });
});

export default router;
