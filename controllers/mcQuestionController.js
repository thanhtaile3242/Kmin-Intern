import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
// Utils
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilter,
    removeSpecialCharactersAndTrim,
    countMatching,
} from "../utils/utils_MCQ.js";

// Controller for API create MCQ
export const handleCreateMCQ = async (req, res) => {
    try {
        // Get all information sent from the client
        const userID = req.userId;
        const listQuestion = req.body;
        // The loop for inserting the list of questions
        for (const question of listQuestion) {
            const { name, description, tag, level } = question;
            // Create uuid for each question (Also use for answers of this question)
            const uuidQuestion = uuidv4();
            // Insert each question into question table
            const queryQuestion = `INSERT INTO question (\`uid\`,\`account_uid\`,\`question_type_id\`,\`name\`,\`description\`, \`tag\`, \`level\`) VALUES ('${uuidQuestion}', UUID_TO_BIN('${userID}'),'1','${name}','${description}','${tag}', '${level}')`;
            await db.execute(queryQuestion);
            // Insert each answer into answer table
            for (const answer of question.answers) {
                const { order_answer, description, correct } = answer;
                const uuidAnswer = uuidv4();
                const queryAnswer = `INSERT INTO answer (\`uid\`,\`mc_question_uid\`,\`order_answer\`,\`description\`,\`correct\`) 
                VALUES ('${uuidAnswer}', '${uuidQuestion}','${order_answer}','${description}','${correct}')`;
                await db.execute(queryAnswer);
            }
        }
        return res
            .status(201)
            .json({ message: "Questions created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Controller for API delete MCQ (soft-delete)
export const handleDeleteMCQ = async (req, res) => {
    try {
        const question_uid = req.params.id.trim();
        const userId = req.userId;
        // Prepare the queries using placeholders for parameters
        const queryDeleteQ = `UPDATE question SET is_deleted = 1 WHERE account_uid = UUID_TO_BIN('${userId}') AND uid = '${question_uid}'`;
        const queryDeleteA = `UPDATE answer SET is_deleted = 1 WHERE mc_question_uid = '${question_uid}'`;

        // Start a transaction
        await db.beginTransaction();

        // Soft-delete the question using a parameterized query
        await db.execute(queryDeleteQ);

        // Soft-delete the answers associated with the question using a parameterized query
        await db.execute(queryDeleteA);

        // Commit the transaction
        await db.commit();

        // If both operations are successful, send a success response
        return res
            .status(200)
            .json({ message: "User soft-deleted successfully." });
    } catch (err) {
        // If there's an error, rollback the transaction
        await db.rollback();
        console.error(err);
        // Send an error response
        return res.status(500).json({ error: "Error soft-deleting user" });
    }
};

// Controller for API update MCQ
export const handleUpdateMCQ = async (req, res) => {
    try {
        const newQuestion = req.body[0];
        let newData = req.body[0].answers;
        const question_uid = req.params.id.trim();
        const userId = req.userId;
        // Update question
        const { name, description, tag, level } = newQuestion;
        const query = `UPDATE question SET name = '${name}', description = '${description}', tag = '${tag}', level = '${level}'
        WHERE account_uid = UUID_TO_BIN('${userId}') AND uid = '${newQuestion.question_uid}'`;
        await db.execute(query);
        // Update answers
        const query1 = `SELECT * FROM answer WHERE mc_question_uid = '${question_uid}' and is_deleted = '0'`;
        let [currentData] = await db.execute(query1);
        // lấy 2 list uid
        const newUID = new Set(newData.map((item) => item.uid));
        const currentUID = new Set(currentData.map((item) => item.uid));

        // Lấy list trùng của newData
        const sameInNewData = newData.filter((item) =>
            currentUID.has(item.uid)
        );

        // Lấy list không trùng của newData
        let notSameInNewData = newData.filter(
            (item) => !currentUID.has(item.uid)
        );

        // Lấy list không trùng của currentData
        let notSameInCurrentData = currentData.filter(
            (item) => !newUID.has(item.uid)
        );
        // Delete
        if (notSameInCurrentData.length > 0) {
            for (const item of notSameInCurrentData) {
                const query2 = `UPDATE answer SET is_deleted = 1 WHERE uid = '${item.uid}'`;
                await db.execute(query2);
            }
        }
        // Update
        if (sameInNewData.length > 0) {
            for (const item of sameInNewData) {
                const { uid, order_answer, description, correct } = item;
                const query3 = `UPDATE answer SET order_answer = '${order_answer}', description = '${description}', correct = '${correct}'
                WHERE uid = '${uid}'`;
                await db.execute(query3);
            }
        }
        // Insert
        if (notSameInNewData.length > 0) {
            notSameInNewData = notSameInNewData.map((obj) => ({
                ...obj,
                uid: uuidv4(),
            }));
            for (const item of notSameInNewData) {
                const { uid, order_answer, description, correct } = item;
                const query3 = `INSERT INTO answer (\`mc_question_uid\`,\`uid\`,\`order_answer\`, \`description\`, \`correct\`) VALUES ('${question_uid}','${uid}', '${order_answer}', '${description}', '${correct}')`;
                await db.execute(query3);
            }
        }

        res.status(200).json({ message: "Update successful" });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
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

        let query = `SELECT uid, description, name, tag, level ,CONCAT(name, " ", description, " ", tag) AS full_name
        FROM question WHERE account_uid = UUID_TO_BIN('${userId}') AND is_deleted = '0'`;
        //
        if (level) {
            query += ` AND level = ${level}`;
        }
        //
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }
        //
        if (keyword) {
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
            query = generateQuerySearchFilter(keyword, query);
        }
        //
        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` limit ${limit} offset ${offset}`;
        }
        // Get data
        let [currentList, field] = await db.execute(query);
        // Ranking related keyword
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

        res.status(200).json({
            data: currentList,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
        });
    }
};
