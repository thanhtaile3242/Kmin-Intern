import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
import {
    removeVietnameseDiacritics,
    generateQuerySearchFilterChallenge,
    removeSpecialCharactersAndTrim,
    countMatching,
    arraysEqual,
    challengeResult,
} from "../utils/utils.js";

// Controller for API create a challenge
export const handleCreateChallenge = async (req, res) => {
    try {
        // 1. Get data from client
        const userId = req.userId;
        const data = req.body[0];
        const { name, description, minute, questions, is_public } = data;
        // Insert data
        await db.beginTransaction();

        const challenge_uid = uuidv4();
        // 2. challenge-detail table
        for (const question of questions) {
            const { question_uid, weight } = question;
            const query1 = `INSERT INTO challenge_detail (\`challenge_uid\`, \`question_uid\`, \`weight\`) VALUES ('${challenge_uid}', '${question_uid}', '${weight}')`;
            await db.execute(query1);
        }
        // 3. Calculate the level of challenge
        const queryLevel = `SELECT AVG(q.level) as average FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}'
        GROUP BY cd.challenge_uid;`;
        const [resultLevel] = await db.execute(queryLevel);
        const level = Math.round(resultLevel[0].average);

        // 4. challenge table
        const query2 = `INSERT INTO challenge (\`uid\`, \`creator_uid\`, \`name\`, \`description\`, \`minute\`, \`is_public\`, \`level\` )
        VALUES ('${challenge_uid}', UUID_TO_BIN('${userId}'), '${name}', '${description}', '${minute}', '${is_public}', '${level}')`;
        await db.execute(query2);

        // 5. assignment table
        const assignment_uid = uuidv4();
        const queryAssign = `INSERT INTO assignment (\`uid\`, \`creator_uid\`, \`name\`, \`description\`, \`is_public\`)
            VALUES ('${assignment_uid}', UUID_TO_BIN('${userId}'), '${name}', '${description}', '${is_public}')`;
        await db.execute(queryAssign);
        // 6. Assignment detail table
        const queryAD = `INSERT INTO assignment_detail (\`challenge_uid\`, \`assignment_uid\`) VALUES ('${challenge_uid}', '${assignment_uid}')`;
        await db.execute(queryAD);

        await db.commit();
        return res.status(200).json({
            status: "success",
            message: "Challenge created successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error creating challenge:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to create challenge",
        });
    }
};
// Controller for API delete a challenge
export const handleDeleteChallenge = async (req, res) => {
    try {
        await db.beginTransaction();
        // 1. Get data from client
        const userId = req.userId;
        const challenge_uid = req.params.id.trim();
        // 2. challenge table (soft-delete)
        const queryDeleteC = `UPDATE challenge SET is_deleted = 1 WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${challenge_uid}'`;
        await db.execute(queryDeleteC);

        // 3. challenge_detail table (soft-delete)
        const queryDeleteCD = `UPDATE challenge_detail SET is_deleted = 1 WHERE challenge_uid = '${challenge_uid}'`;
        await db.execute(queryDeleteCD);

        // 4. assignment table
        // Step 1: Get all assignments contain this challenge
        // Step 2: Count the number of challenges in each assignment
        // Step 3: Soft-delete with assignment having 1 challenge (assignment table)
        const queryAS = `SELECT * FROM assignment_detail ad WHERE ad.challenge_uid = '${challenge_uid}'`;
        const [resultAS] = await db.execute(queryAS);

        for (const assignment of resultAS) {
            const assignment_uid = assignment.assignment_uid;
            const queryCount = `SELECT COUNT(ad.challenge_uid) as count, ad.assignment_uid FROM assignment_detail ad WHERE ad.assignment_uid  = '${assignment_uid}' AND is_deleted = '0' GROUP BY ad.assignment_uid`;
            const [resultCount] = await db.execute(queryCount);
            const numberChallenge = resultCount[0]?.count;

            if (numberChallenge == 1) {
                const queryASoftDelete = `UPDATE assignment SET is_deleted = '1' WHERE uid = '${assignment_uid}'`;
                await db.execute(queryASoftDelete);
            }
        }

        // 5. assignment_detail table (soft-delete)
        const queryADSoftDelete = `UPDATE assignment_detail SET is_deleted = '1' WHERE challenge_uid = '${challenge_uid}'`;
        await db.execute(queryADSoftDelete);

        await db.commit();
        return res.status(200).json({
            status: "success",
            message: "Challenge deleted successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error deleting challenge:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to delete challenge.",
        });
    }
};
// Controller for API search and filter public challenges (solver and creator)
export const handleSearchPublicChallenges = async (req, res) => {
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
        // Generate the origin query statement
        let query = `SELECT creator_uid, uid, description, name , level, is_public, CONCAT( name, " ", description) AS full_name
        FROM challenge WHERE is_deleted = '0' AND is_public = '1'`;
        // If having filter by level of challenges
        if (level) {
            query += ` AND level = ${level}`;
        }
        // if having sort challenges by name or created_at
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }
        // if having search by keyword
        if (keyword) {
            keyword = keyword.toLowerCase();
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
        }
        // Get query statement
        query = generateQuerySearchFilterChallenge(keyword, query);
        // if having paginate
        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` limit ${limit} offset ${offset}`;
        }
        // Get challenges
        let [currentList, field] = await db.execute(query);
        // Get total questions of each challenge
        for (let i = 0; i < currentList.length; i++) {
            const challenge_uid = currentList[i].uid;
            const queryQ = `SELECT count(question_uid) as totalQuestions FROM challenge_detail WHERE challenge_uid = '${challenge_uid}' GROUP BY challenge_uid`;
            const [questions] = await db.execute(queryQ);
            currentList[i].totalQuestions = questions[0].totalQuestions;
        }
        // Ranking challenges base on keyword
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
        //
        if (currentList.length == 0) {
            return res.status(400).json({
                status: "fail",
                message: "Not challenges found",
                data: [],
            });
        }
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
// Controller for API search and filter challenges-owned (creator - public and private challenges)
export const handleSearchChallengesOwned = async (req, res) => {
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
        // Generate the origin query statement
        let query = `SELECT creator_uid, uid, description, name , level, is_public,CONCAT( name, " ", description) AS full_name
        FROM challenge WHERE is_deleted = '0' AND creator_uid =UUID_TO_BIN('${userId}')`;
        // If having filter by level of challenges
        if (level) {
            query += ` AND level = ${level}`;
        }
        // if having sort challenges by name or created_at
        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }
        // if having search by keyword
        if (keyword) {
            keyword = keyword.toLowerCase();
            keyword = removeSpecialCharactersAndTrim(keyword);
            keyword = removeVietnameseDiacritics(keyword);
        }
        // Get query statement
        query = generateQuerySearchFilterChallenge(keyword, query);
        // if having paginate
        if (limit && page) {
            const offset = (page - 1) * limit;
            query += ` limit ${limit} offset ${offset}`;
        }
        // Get challenges
        let [currentList, field] = await db.execute(query);
        // Get total questions of each challenge
        for (let i = 0; i < currentList.length; i++) {
            const challenge_uid = currentList[i].uid;
            const queryQ = `SELECT count(question_uid) as totalQuestions FROM challenge_detail WHERE challenge_uid = '${challenge_uid}' GROUP BY challenge_uid`;
            const [questions] = await db.execute(queryQ);
            currentList[i].totalQuestions = questions[0].totalQuestions;
        }
        // Ranking challenges base on keyword
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
        //
        if (currentList.length == 0) {
            return res.status(400).json({
                status: "fail",
                message: "Not challenges found",
                data: [],
            });
        }
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
// Controller for API update a challenge
export const handleUpdateChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const challenge_uid = req.params.id.trim();
        const newChallenge = req.body[0];
        const newQuestions = newChallenge.questions;
        await db.beginTransaction();

        // Delete all old questions in a challenge
        const query1 = `DELETE FROM challenge_detail WHERE challenge_uid = '${challenge_uid}'`;
        await db.execute(query1);

        // Insert all new questions in a challenge
        for (const question of newQuestions) {
            const { question_uid, weight } = question;
            const query2 = `INSERT INTO challenge_detail (\`challenge_uid\`, \`question_uid\`, \`weight\`)
            VALUES ('${challenge_uid}', '${question_uid}', '${weight}')`;
            await db.execute(query2);
        }

        // Calculate the level of challenge (update level of a challenge)
        const queryLevel = `SELECT AVG(q.level) as average FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}'
        GROUP BY cd.challenge_uid;`;
        const [resultLevel] = await db.execute(queryLevel);
        const level = Math.round(resultLevel[0].average);

        // Update information of a challenge
        const { name, description, minute, is_public } = newChallenge;
        const queryC = `UPDATE challenge SET name = '${name}', description = '${description}', minute = '${minute}', level = '${level}', is_public ='${is_public}'
        WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${challenge_uid}'`;
        let [result1] = await db.execute(queryC);

        // Update information of an assignment
        const queryAS = `select * from assignment_detail ad  where ad.challenge_uid = '${challenge_uid}'`;
        const [resultAS] = await db.execute(queryAS);
        const assignment_uid = resultAS[0].assignment_uid;
        const updateAS = `UPDATE assignment SET name = '${name}', description = '${description}', is_public ='${is_public}'
        WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${assignment_uid}'`;
        await db.execute(updateAS);

        await db.commit();
        return res.status(200).json({
            status: "success",
            message: "Challenge updated successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error updating challenge:", error);
        return res.status(500).json({
            status: "error",
            message: "Error updating challenge",
        });
    }
};
// Controller for API detail one challenge and its questions
export const handleDetailOneChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const challenge_uid = req.params.id;
        // Get a challenge
        const queryC = `SELECT c.uid, c.description, c.name, a.username
            FROM challenge c JOIN account a ON a.uid = c.creator_uid WHERE c.uid = '${challenge_uid}' AND is_deleted = '0'`;
        const [resultC] = await db.execute(queryC);

        if (resultC.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Challenge not found",
            });
        }
        // Calculate total questions
        const queryTQ = `SELECT count(q.uid) as totalQuestions FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}' GROUP BY cd.challenge_uid`;
        const [resultTQ] = await db.execute(queryTQ);
        resultC[0].totalQuestions = resultTQ[0].totalQuestions;

        // Get questions
        const queryQ = `SELECT q.uid ,q.name, q.description FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}'`;
        const [resultQ] = await db.execute(queryQ);
        resultC[0].questions = resultQ;

        // Get answers
        for (let i = 0; i < resultQ.length; i++) {
            const mc_question_uid = resultC[0].questions[i].uid;
            const queryA = `SELECT uid, description FROM answer WHERE mc_question_uid = '${mc_question_uid}'AND is_deleted = '0'`;
            const [resultA] = await db.execute(queryA);
            resultC[0].questions[i].answers = resultA;
        }

        return res.status(200).json({
            status: "success",
            data: resultC[0],
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
// Controller for API introduce one challenge and its questions (maximum display 3 questions)
export const handleIntroduceOneChallene = async (req, res) => {
    try {
        const challenge_uid = req.params.id;
        const userId = req.userId;

        const queryC = `SELECT c.uid, c.description, c.name, a.username
            FROM challenge c JOIN account a ON a.uid = c.creator_uid WHERE c.uid = '${challenge_uid}' AND is_deleted = '0'`;
        const [resultC] = await db.execute(queryC);

        if (resultC.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Challenge not found",
            });
        }

        // Get total number of questions
        const queryN = `SELECT count(q.uid) as totalQuestions FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}' GROUP BY cd.challenge_uid`;
        const [questions] = await db.execute(queryN);
        resultC[0].totalQuestions = questions[0].totalQuestions;

        // Get 3 questions for review
        const queryQ = `SELECT q.name, q.description FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}' limit 3`;
        const [resultQ] = await db.execute(queryQ);
        resultC[0].questions = resultQ;

        return res.status(200).json({
            status: "success",
            data: resultC[0],
        });
    } catch (error) {
        console.error("Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
// Controller for API get result when submit a challenge
export const handleSumbitChallange = async (req, res) => {
    try {
        // Get data
        const userId = req.userId;
        const clientData = req.body[0];
        const challenge_uid = req.body[0].challenge_uid;

        // Get a challenge
        const queryC = `SELECT uid, description FROM challenge WHERE uid = '${challenge_uid}' AND is_deleted = '0'`;
        const [resultC] = await db.execute(queryC);

        if (resultC.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Challenge not found",
            });
        }

        // Get questions
        const queryQ = `SELECT q.uid FROM challenge_detail cd JOIN question q ON cd.question_uid = q.uid WHERE cd.challenge_uid = '${challenge_uid}'`;
        const [resultQ] = await db.execute(queryQ);
        resultC[0].questions = resultQ;

        // Get correct answers (correct = 1)
        for (let i = 0; i < resultQ.length; i++) {
            const mc_question_uid = resultC[0].questions[i].uid;
            const queryA = `SELECT uid, description, correct FROM answer WHERE mc_question_uid = '${mc_question_uid}' AND is_deleted = '0' AND correct = '1'`;
            const [resultA] = await db.execute(queryA);
            resultC[0].questions[i].answers = resultA;
        }

        // System Correct
        const listQuestions = resultC[0].questions;
        const systemCorrect = listQuestions.map((question) => ({
            question_uid: question.uid,
            correctAnswers: question.answers.map((answer) => answer.uid),
        }));

        // Create System Data
        const systemData = {
            challenge_uid: resultC[0].uid,
            challenge_description: resultC[0].description,
            systemAnswers: systemCorrect,
        };

        // Get the result of the challenge
        const finalResult = challengeResult(clientData, systemData);

        return res.status(200).json({
            status: "success",
            data: finalResult,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
