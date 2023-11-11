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
    handleUpdateMCQ2,
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
// [checkValidToken, checkEmptyMCQ, checkQuestionExistent]
// [checkValidToken, checkQuestionExistent],
// router.put("/edit", checkValidToken, handleUpdateMCQ);

router.post("/abc", handleUpdateMCQ2);
export default router;
