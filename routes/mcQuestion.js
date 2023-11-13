import express from "express";
import db from "../models/db.js";
// utils
import {
    removeVietnameseDiacritics,
    generateCollateQuery,
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
    handleSearchMCQbyKeyword,
    handleGetAllMCQ,
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

// API get question by keyword
router.get(
    "/search-keyword",
    [checkValidToken, checkFilterEmpty],
    handleSearchMCQbyKeyword
);

// API get all questions of a user
router.get("/all", [checkValidToken], handleGetAllMCQ);

export default router;
// Test
const generateCollateQueryDemo = (keyword, query) => {
    const keywords = keyword.split(" ");

    const conditionClauses = keywords
        .map((kw) => `full_name COLLATE utf8mb4_unicode_520_ci LIKE '%${kw}%'`)
        .join(" AND ");
    let sqlQuery = `SELECT uid, description, name, full_name, level, tag FROM (${query}) AS subquery
    WHERE ${conditionClauses}`;

    return sqlQuery;
};

router.get("/test", async (req, res) => {
    let sortOrder = ["asc", "desc"].includes(req.query.sortOrder)
        ? req.query.sortOrder
        : "";
    let sortField = ["name", "created_at"].includes(req.query.sortField)
        ? req.query.sortField
        : "";
    let level = ["1", "2", "3"].includes(req.query.level)
        ? req.query.level
        : "";
    const page = req.query.page;
    const limit = req.query.limit;
    let keyword = req.query.keyword;

    let query = `select uid, description, name, tag, level ,CONCAT(name, " ", description, " ", tag) AS full_name
    FROM question Where is_deleted = 0`;
    //
    if (level) {
        query += ` and level = ${level}`;
    }
    //
    if (sortField && sortOrder) {
        query += ` order by ${sortField} ${sortOrder}`;
    }
    //
    if (keyword) {
        keyword = removeSpecialCharactersAndTrim(keyword);
        keyword = removeVietnameseDiacritics(keyword);
        query = generateCollateQueryDemo(keyword, query);
    }

    if (limit && page) {
        const offset = (page - 1) * limit;
        query += ` limit ${limit} offset ${offset}`;
    }
    let [currentList, field] = await db.execute(query);
    // Demo2 Ranking related keyword
    if (keyword) {
        currentList = currentList.map((obj) => {
            return {
                ...obj,
                full_name: removeVietnameseDiacritics(
                    obj.full_name
                ).toLowerCase(),
            };
        });

        // Filter and Ranking the order of the questions in result
        // First step
        let filterList = [];
        let scores = [];

        for (let item of currentList) {
            const fullName = item.full_name;
            const score = countMatching(keyword, fullName);

            // If the keyword is similar to fullName, add the item to the array
            if (score > 0) {
                scores.push(score);
                filterList.push(item);
            }
        }

        // Second step
        const combinedArray = scores.map((value, index) => ({
            score: value,
            question: filterList[index],
        }));

        combinedArray.sort((a, b) => b.score - a.score);
        combinedArray.forEach((item) => {
            delete item.score;
        });

        // Get the final list
        currentList = combinedArray.map((item) => item.question);
        currentList.forEach((item) => {
            delete item.full_name;
        });
    }

    res.json({
        data: currentList,
    });
});
