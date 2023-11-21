import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilter,
    removeSpecialCharactersAndTrim,
    countMatching,
} from "../utils/utils.js";

// Controller for API create MCQ
export const handleCreateMCQ = async (req, res) => {
    try {
        const userID = req.userId;
        const listQuestion = req.body;
        await db.beginTransaction();
        for (const question of listQuestion) {
            const { name, description, tag, level } = question;

            const uuidQuestion = uuidv4();

            const queryQuestion = `INSERT INTO question (\`uid\`,\`account_uid\`,\`question_type_id\`,\`name\`,\`description\`, \`tag\`, \`level\`) VALUES ('${uuidQuestion}', UUID_TO_BIN('${userID}'),'1','${name}','${description}','${tag}', '${level}')`;

            await db.execute(queryQuestion);

            for (const answer of question.answers) {
                const { order_answer, description, correct } = answer;
                const uuidAnswer = uuidv4();

                const queryAnswer = `INSERT INTO answer (\`uid\`,\`mc_question_uid\`,\`order_answer\`,\`description\`,\`correct\`) 
                VALUES ('${uuidAnswer}', '${uuidQuestion}','${order_answer}','${description}','${correct}')`;

                await db.execute(queryAnswer);
            }
        }

        await db.commit();
        return res.status(201).json({
            status: "success",
            message: "Questions created successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error: Unable to create questions",
        });
    }
};
// Controller for API delete MCQ (soft-delete)
export const handleDeleteMCQ = async (req, res) => {
    try {
        const question_uid = req.params.id.trim();
        const userId = req.userId;

        const queryDeleteQ = `UPDATE question SET is_deleted = 1 WHERE account_uid = UUID_TO_BIN('${userId}') AND uid = '${question_uid}'`;
        const queryDeleteA = `UPDATE answer SET is_deleted = 1 WHERE mc_question_uid = '${question_uid}'`;
        const queryDeleteC = `DELETE FROM challenge_detail WHERE question_uid = '${question_uid}'`;
        await db.beginTransaction();

        await db.execute(queryDeleteQ);

        await db.execute(queryDeleteA);

        await db.execute(queryDeleteC);

        await db.commit();

        return res.status(200).json({
            status: "success",
            message: "Question soft-deleted successfully.",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to delete question",
        });
    }
};
// Controller for API update MCQ
export const handleUpdateMCQ = async (req, res) => {
    try {
        const newQuestion = req.body[0];
        let newAnswers = req.body[0].answers;
        const question_uid = req.params.id.trim();
        const userId = req.userId;
        //
        await db.beginTransaction();
        const { name, description, tag, level } = newQuestion;
        const queryUpdateQuestion = `UPDATE question SET name = '${name}', description = '${description}', tag = '${tag}', level = '${level}'
        WHERE account_uid = UUID_TO_BIN('${userId}') AND uid = '${question_uid}'`;

        await db.execute(queryUpdateQuestion);

        const queryGetcurrentAnswers = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}' and is_deleted = '0'`;
        let [currentAnswers] = await db.execute(queryGetcurrentAnswers);

        const newUID = new Set(newAnswers.map((item) => item.uid));
        const currentUID = new Set(currentAnswers.map((item) => item.uid));

        const sameInnewAnswers = newAnswers.filter((item) =>
            currentUID.has(item.uid)
        );

        let notSameInnewAnswers = newAnswers.filter(
            (item) => !currentUID.has(item.uid)
        );

        let notSameIncurrentAnswers = currentAnswers.filter(
            (item) => !newUID.has(item.uid)
        );

        if (notSameIncurrentAnswers.length > 0) {
            for (const item of notSameIncurrentAnswers) {
                const queryDeleteAnswer = `DELETE FROM answer WHERE uid = '${item.uid}' AND mc_question_uid = '${question_uid}'`;
                await db.execute(queryDeleteAnswer);
            }
        }

        if (sameInnewAnswers.length > 0) {
            for (const item of sameInnewAnswers) {
                const { uid, order_answer, description, correct } = item;
                const queryUpdateAnswer = `UPDATE answer SET order_answer = '${order_answer}', description = '${description}', correct = '${correct}'
                WHERE uid = '${uid}' AND mc_question_uid = '${question_uid}'`;
                await db.execute(queryUpdateAnswer);
            }
        }

        if (notSameInnewAnswers.length > 0) {
            notSameInnewAnswers = notSameInnewAnswers.map((obj) => ({
                ...obj,
                uid: uuidv4(),
            }));
            for (const item of notSameInnewAnswers) {
                const { uid, order_answer, description, correct } = item;
                const queryInsertAnswer = `INSERT INTO answer (\`mc_question_uid\`,\`uid\`,\`order_answer\`, \`description\`, \`correct\`) VALUES ('${question_uid}','${uid}', '${order_answer}', '${description}', '${correct}')`;
                await db.execute(queryInsertAnswer);
            }
        }

        await db.commit();
        return res.status(200).json({
            status: "success",
            message: "Question updated successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res
            .status(500)
            .json({ status: "error", message: "Internal server error" });
    }
};
// Controller for API search and filter MC questions
export const handleSearchAndFilterMCQ = async (req, res) => {
    try {
        const userId = req.userId;
        const page = req.query.page;
        const limit = req.query.limit;
        let keyword = req.query.keyword;
        let sortOrder = ["asc", "desc"].includes(req.query.sortOrder)
            ? req.query.sortOrder
            : "";
        let sortField = ["name", "created_at"].includes(req.query.sortField)
            ? req.query.sortField
            : "";
        let level = ["1", "2", "3"].includes(req.query.level)
            ? req.query.level
            : "";

        let query = `SELECT account_uid, uid, description, name, tag, level ,CONCAT(name, " ", description, " ", tag) AS full_name
        FROM question WHERE account_uid = UUID_TO_BIN('${userId}') AND is_deleted = '0'`;
        // if having filter by level of questions
        if (level) {
            query += ` AND level = ${level}`;
        }
        // if having sort by name or created_at
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }
        // if having search by keyword
        if (keyword) {
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
        }
        query = generateQuerySearchFilter(keyword, query);
        // if having paginate
        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` limit ${limit} offset ${offset}`;
        }
        // Get questions
        let [currentList, field] = await db.execute(query);
        // Get answers
        for (let i = 0; i < currentList.length; i++) {
            const mc_question_uid = currentList[i].uid;
            const queryA = `SELECT uid, description FROM answer WHERE mc_question_uid = '${mc_question_uid}'AND is_deleted = '0'`;
            const [answers] = await db.execute(queryA);
            currentList[i].answers = answers;
        }
        // Ranking questions base on keyword
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
        }
        currentList.forEach((item) => {
            delete item.full_name;
        });
        if (currentList.length == 0) {
            return res.status(400).json({
                status: "fail",
                message: "Not questions found",
                data: [],
            });
        }
        //
        return res.status(200).json({
            status: "success",
            data: currentList,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
// Controller for API display one question and its answers
export const handleDetailOneMCQ = async (req, res) => {
    try {
        const userId = req.userId;
        const question_uid = req.params.id;

        // Get a question
        const queryQ = `SELECT a.username, q.uid, q.description, q.name, q.tag, q.level 
        FROM question q JOIN account a ON q.account_uid = a.uid WHERE q.account_uid = UUID_TO_BIN('${userId}') AND q.uid = '${question_uid}' AND q.is_deleted = '0'`;
        const [resultQ] = await db.execute(queryQ);

        if (resultQ.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Question not found",
            });
        }

        // Get its answers
        const queryA = `SELECT uid, description FROM answer WHERE mc_question_uid = '${question_uid}'AND is_deleted = '0'`;
        const [resultA] = await db.execute(queryA);

        resultQ[0].answers = resultA;
        return res.status(200).json({
            status: "success",
            data: resultQ,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
