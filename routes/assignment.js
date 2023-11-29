import express from "express";
const router = express.Router();
// Middleware
import * as commonMiddleware from "../middleware/commonMiddleware.js";
import * as assignmentMiddleware from "../middleware/assignmentMiddleware.js";
// Controllers
import * as assignmentController from "../controllers/assignmentController.js";

// API create an assignment
router.post(
    "/create",
    [commonMiddleware.authentication, commonMiddleware.checkEmptyData],
    assignmentController.handleCreateAssignment
);
// API delete an assignment (soft-delete)
router.delete(
    "/:id",
    [
        commonMiddleware.authentication,
        assignmentMiddleware.checkAssignmentExistent,
    ],
    assignmentController.handleDeleteAssignment
);
// API update an assignment
router.put(
    "/:id",
    [
        commonMiddleware.authentication,
        commonMiddleware.checkEmptyData,
        assignmentMiddleware.checkAssignmentExistent,
    ],
    assignmentController.handleUpdateAssignment
);
// API search assignments (Role: Creator and Solver)
router.get(
    "/search",
    [commonMiddleware.authentication],
    assignmentController.handleSearchAssignments
);
// API detail an assignment and its challenges
router.get(
    "/:id",
    [
        commonMiddleware.authentication,
        assignmentMiddleware.checkAssignmentExistent,
    ],
    assignmentController.handleDetailAssignment
);

export default router;
