import express from "express";
import db from "../models/db.js";
// utils
import {
    removeVietnameseDiacritics,
    generateCollateQuery,
    countMatching,
} from "../utils/utils_MCQ.js";
// Middleware
import {
    checkValidToken,
    checkEmptyMCQ,
    checkQuestionExistent,
    checkFilterEmpty,
    checkLimitOfMCQ,
} from "../middleware/mcQuestionMiddleware.js";
// Controller
import {
    handleCreateMCQ,
    handleDeleteMCQ,
    handleUpdateMCQ,
    handleSearchMCQbyKeyword,
    handleGetAllMCQ,
} from "../controllers/mcQuestionController.js";

const router = express.Router();
// API create Multiple choice question
router.post(
    "/create-multiple-choice",
    [checkValidToken, checkEmptyMCQ, checkLimitOfMCQ],
    handleCreateMCQ
);
// API delete a question (soft-delete)
router.delete(
    "/delete/:id",
    [checkValidToken, checkQuestionExistent],
    handleDeleteMCQ
);
// API update a question
router.put("/edit/:id", [checkValidToken, checkEmptyMCQ], handleUpdateMCQ);

// API get question by keyword
router.get("/search-keyword", [checkFilterEmpty], handleSearchMCQbyKeyword);

// API get all questions of a user
router.get("/all", [checkValidToken], handleGetAllMCQ);

export default router;
