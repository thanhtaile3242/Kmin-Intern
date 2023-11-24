import express from "express";
import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilterAssignment,
    removeSpecialCharactersAndTrim,
    countMatching,
    arraysEqual,
    challengeResult,
} from "../utils/utils.js";
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
//
router.get("/search", checkValidToken, async (req, res) => {
    try {
        const userId = req.userId;
        const page = req.query.page;
        const limit = req.query.limit;

        let keyword = req.query.keyword;
        let sortField = ["name", "created_at"].includes(req.query.sortField)
            ? req.query.sortField
            : "";
        let sortOrder = ["asc", "desc"].includes(req.query.sortOrder)
            ? req.query.sortOrder
            : "";
        let own = ["1", "0"].includes(req.query.own) ? req.query.own : "";

        let query = `SELECT creator_uid, uid, description, name, is_public, CONCAT(name, " ", description) AS full_name
            FROM assignment WHERE is_deleted = '0'`;

        if (own == "1") {
            query += ` AND creator_uid =UUID_TO_BIN('${userId}')`;
        }
        if (own == "0") {
            query += ` AND is_public = '1'`;
        }
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }

        if (keyword) {
            keyword = keyword.toLowerCase();
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
        }

        query = generateQuerySearchFilterAssignment(keyword, query);

        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` LIMIT ${limit} OFFSET ${offset}`;
        }

        let [currentList, field] = await db.execute(query);

        if (currentList.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "No assignments found",
                data: [],
            });
        }

        for (let i = 0; i < currentList.length; i++) {
            const assignment_uid = currentList[i].uid;
            const queryC = `SELECT COUNT(challenge_uid) AS totalChallenges FROM assignment_detail WHERE assignment_uid = ? AND is_deleted = '0' GROUP BY assignment_uid`;
            const [challenges] = await db.execute(queryC, [assignment_uid]);
            currentList[i].totalChallenges =
                challenges[0]?.totalChallenges || 0;
        }

        if (keyword) {
            currentList = currentList.map((obj) => ({
                ...obj,
                full_name: removeVietnameseDiacritics(
                    obj.full_name
                ).toLowerCase(),
            }));

            let filterList = [];
            let scores = [];

            for (let item of currentList) {
                const fullName = item.full_name;
                const score = countMatching(keyword, fullName);

                if (score > 0) {
                    scores.push(score);
                    filterList.push(item);
                }
            }

            const combinedArray = scores.map((value, index) => ({
                score: value,
                assignment: filterList[index],
            }));

            combinedArray.sort((a, b) => b.score - a.score);
            combinedArray.forEach((item) => {
                delete item.score;
            });

            currentList = combinedArray.map((item) => item.assignment);
        }

        currentList.forEach((item) => {
            delete item.full_name;
        });

        return res.status(200).json({
            status: "success",
            data: currentList,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

export default router;
