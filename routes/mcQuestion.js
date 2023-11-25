import express from "express";
const router = express.Router();
// Middleware
import * as commonMiddleware from "../middleware/commonMiddleware.js";
import * as questionMiddleware from "../middleware/mcQuestionMiddleware.js";
// // Controllers
import * as questionController from "../controllers/mcQuestionController.js";

// API create multiple choice questions
router.post(
    "/create-multiple-choice",
    [
        commonMiddleware.authentication,
        commonMiddleware.checkEmptyData,
        questionMiddleware.checkLimitOfMCQ,
    ],
    questionController.handleCreateMCQ
);
// API delete a question (soft-delete)
router.delete(
    "/:id",
    [commonMiddleware.authentication, questionMiddleware.checkQuestionExistent],
    questionController.handleDeleteMCQ
);
// API update a question
router.put(
    "/:id",
    [
        commonMiddleware.authentication,
        commonMiddleware.checkEmptyData,
        questionMiddleware.checkQuestionExistent,
    ],
    questionController.handleUpdateMCQ
);
// API get questions by search and filter (Role: Creator)
router.get(
    "/search",
    [commonMiddleware.authentication],
    questionController.handleSearchAndFilterMCQ
);
// API display detail a question including its answers
router.get(
    "/:id",
    [commonMiddleware.authentication, questionMiddleware.checkQuestionExistent],
    questionController.handleDetailOneMCQ
);

export default router;
