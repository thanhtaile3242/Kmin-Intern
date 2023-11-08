import express from "express";
import db from "../models/db.js";
const router = express.Router();
import {
    checkValidToken,
    checkEmptyMCQ,
    checkQuestionExistent,
} from "../middleware/mcQuestionMiddleware.js";
import {
    handleCreateMCQ,
    handleDeleteMCQ,
    handleUpdateMCQ,
} from "../controllers/mcQuestionController.js";

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
router.put(
    "/edit",
    [checkValidToken, checkEmptyMCQ, checkQuestionExistent],
    handleUpdateMCQ
);

export default router;
