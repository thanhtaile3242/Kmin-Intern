import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();
import {
    checkValidToken,
    checkEmptyData,
} from "../middleware/mcQuestionMiddleware.js";
import { handleCreateAssignment } from "../controllers/assignmentController.js";
router.post(
    "/create",
    [checkValidToken, checkEmptyData],
    handleCreateAssignment
);
export default router;
