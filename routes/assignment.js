import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();
import {
    checkValidToken,
    checkEmptyData,
} from "../middleware/mcQuestionMiddleware.js";
import { checkAssignmentExistent } from "../middleware/assignmentMiddleware.js";
import {
    handleCreateAssignment,
    handleDeleteAssignment,
    handleUpdateAssignment,
} from "../controllers/assignmentController.js";

// API create an assignment
router.post(
    "/create",
    [checkValidToken, checkEmptyData],
    handleCreateAssignment
);
// API delete an assignment
router.delete(
    "/:id",
    [checkValidToken, checkAssignmentExistent],
    handleDeleteAssignment
);
// API update an assignment
router.put(
    "/:id",
    [checkValidToken, checkEmptyData, checkAssignmentExistent],
    handleUpdateAssignment
);

export default router;
