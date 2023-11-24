import express from "express";
import db from "../models/db.js";
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilter,
    countMatching,
    removeSpecialCharactersAndTrim,
} from "../utils/utils.js";
// Middleware
import {
    checkValidToken,
    checkEmptyData,
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
    handleDetailOneMCQ,
} from "../controllers/mcQuestionController.js";

const router = express.Router();
// API create Multiple choice question
router.post(
    "/create-multiple-choice",
    [checkValidToken, checkEmptyData, checkLimitOfMCQ],
    handleCreateMCQ
);
// API delete a question (soft-delete)
router.delete(
    "/:id",
    [checkValidToken, checkQuestionExistent],
    handleDeleteMCQ
);
// API update a question
router.put(
    "/:id",
    [checkValidToken, checkEmptyData, checkQuestionExistent],
    handleUpdateMCQ
);

// API get questions by search and filter
router.get("/search", [checkValidToken], handleSearchAndFilterMCQ);

// API display detail a question including its answers
router.get(
    "/:id",
    [checkValidToken, checkQuestionExistent],
    handleDetailOneMCQ
);

// Export router
export default router;
