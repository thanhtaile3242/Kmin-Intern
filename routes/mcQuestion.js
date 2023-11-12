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
} from "../middleware/mcQuestionMiddleware.js";
// Controller
import {
    handleCreateMCQ,
    handleDeleteMCQ,
    handleUpdateMCQ,
    handleSearchMCQbyKeyword,
} from "../controllers/mcQuestionController.js";

const router = express.Router();
// API create Multiple choice question
router.post(
    "/create-multiple-choice",
    [checkValidToken, checkEmptyMCQ],
    handleCreateMCQ
);
// API delete a question (soft-delete)
router.delete(
    "/delete",
    [checkValidToken, checkQuestionExistent],
    handleDeleteMCQ
);
// API update a question
router.put("/edit", [checkValidToken, checkEmptyMCQ], handleUpdateMCQ);

// API get question by keyword
router.get("/search", checkFilterEmpty, handleSearchMCQbyKeyword);

export default router;
