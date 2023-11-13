import express from "express";
import db from "../models/db.js";
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilter,
    countMatching,
    removeSpecialCharactersAndTrim,
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
    handleSearchAndFilterMCQ,
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

// API get questions by search and filter
router.get("/search", [checkValidToken], handleSearchAndFilterMCQ);

// Export router
export default router;
