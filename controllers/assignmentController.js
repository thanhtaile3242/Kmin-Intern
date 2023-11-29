import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
import * as utils from "../utils/utils.js";
// Controller for API create an assignment
export const handleCreateAssignment = async (req, res) => {
    try {
        await db.beginTransaction();
        // 1. Get data from client
        const userId = req.userId;
        const data = req.body[0];
        const { name, description, is_public, challenges } = data;
        const assignment_uid = uuidv4();
        // 2. assignment table
        const queryAssign = `INSERT INTO assignment (\`uid\`, \`creator_uid\`, \`name\`, \`description\`, \`is_public\`) 
        VALUES ('${assignment_uid}', UUID_TO_BIN('${userId}'), '${name}', '${description}', '${is_public}')`;
        await db.execute(queryAssign);

        // 3. assignment detail table
        for (const challenge of challenges) {
            const { challenge_uid } = challenge;
            const queryAD = `INSERT INTO assignment_detail (\`challenge_uid\`, \`assignment_uid\`) VALUES ('${challenge_uid}', '${assignment_uid}')`;
            await db.execute(queryAD);
        }

        await db.commit();

        return res.status(200).json({
            status: "Success",
            message: "Assignment created successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error creating challenge:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to create assignment",
        });
    }
};
// Controller for API delete an assignment
export const handleDeleteAssignment = async (req, res) => {
    try {
        const userId = req.userId;
        const assignment_uid = req.params.id;

        await db.beginTransaction();

        const queryA = `UPDATE assignment SET is_deleted = '1' WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${assignment_uid}'`;
        await db.execute(queryA);

        const queryAD = `UPDATE assignment_detail SET is_deleted = '1' WHERE assignment_uid = '${assignment_uid}'`;
        await db.execute(queryAD);

        await db.commit();

        res.status(200).json({
            status: "success",
            message: "Assignment soft-delete successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error deleting assignment: ", error);
        res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to delete assignment",
        });
    }
};
// Controller for API update an assignment
export const handleUpdateAssignment = async (req, res) => {
    try {
        const userId = req.userId;
        const assignment_uid = req.params.id;
        const newAssignment = req.body[0];
        const newChallenges = newAssignment.challenges;

        await db.beginTransaction();

        // Delete all old challenges in an assignment (in database)
        const queryAD1 = `DELETE FROM assignment_detail WHERE assignment_uid = '${assignment_uid}'`;
        await db.execute(queryAD1);

        // Insert all new questions in a challenge (client send)
        for (const challenge of newChallenges) {
            const { challenge_uid } = challenge;
            const queryAD2 = `INSERT INTO assignment_detail (\`challenge_uid\`, \`assignment_uid\`) VALUES ('${challenge_uid}', '${assignment_uid}')`;
            await db.execute(queryAD2);
        }

        // Update information of an assignment
        const { name, description, is_public } = newAssignment;
        const queryA = `UPDATE assignment SET name = '${name}', description = '${description}', is_public ='${is_public}' WHERE creator_uid = UUID_TO_BIN('${userId}') AND uid = '${assignment_uid}'`;
        await db.execute(queryA);

        await db.commit();

        res.status(200).json({
            status: "success",
            message: "Updata assignment successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error("Error updating assignment: ", error);
        res.status(500).json({
            status: "error",
            message: "Internal Server Error: Unable to update assignment",
        });
    }
};
// Controller for API search assignments
export const handleSearchAssignments = async (req, res) => {
    try {
        const userId = req.userId;
        const page = req.query.page;
        const limit = req.query.limit;

        let keyword = req.query.keyword;
        let sortField = ["name", "created_at"].includes(req.query.sortField)
            ? req.query.sortField
            : "created_at";
        let sortOrder = ["asc", "desc"].includes(req.query.sortOrder)
            ? req.query.sortOrder
            : "asc";
        let own = ["1", "0"].includes(req.query.own) ? req.query.own : "1";
        let is_public = ["1", "0"].includes(req.query.is_public)
            ? req.query.is_public
            : "1";
        //
        let query = `SELECT creator_uid, uid, description, name, is_public, CONCAT(name, " ", description) AS full_name
            FROM assignment WHERE is_deleted = '0'`;
        //
        if (own == "1") {
            query += ` AND creator_uid = UUID_TO_BIN('${userId}')`;
        }
        if (own == "0") {
            query += ` AND is_public = '1' AND creator_uid <> UUID_TO_BIN('${userId}')`;
        }
        //
        if (own == "1" && is_public == "1") {
            query += ` AND creator_uid = UUID_TO_BIN('${userId}') AND  is_public = '1'`;
        }
        if (own == "1" && is_public == "0") {
            query += ` AND creator_uid = UUID_TO_BIN('${userId}') AND  is_public = '0'`;
        }

        if (sortField && sortOrder) {
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        }

        if (keyword) {
            keyword = keyword.toLowerCase();
            keyword = utils.removeSpecialCharactersAndTrim(keyword);
            keyword = utils.removeVietnameseDiacritics(keyword);
        }

        query = utils.generateQuerySearchFilterAssignment(keyword, query);

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
                full_name: utils
                    .removeVietnameseDiacritics(obj.full_name)
                    .toLowerCase(),
            }));

            let filterList = [];
            let scores = [];

            for (let item of currentList) {
                const fullName = item.full_name;
                const score = utils.countMatching(keyword, fullName);

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
            message: "get assignments successfully",
            data: currentList,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};
// Controller for API detail one assignment
export const handleDetailAssignment = async (req, res) => {
    try {
        const userId = req.userId;
        const assignment_uid = req.params.id;
        // Get an assignment
        const queryA = `SELECT a.uid, a.description, a.name, ac.username FROM assignment a JOIN account ac ON ac.uid = a.creator_uid WHERE a.uid = '${assignment_uid}' AND is_deleted = '0'`;
        const [resultA] = await db.execute(queryA);

        if (resultA.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Assignment not found",
            });
        }
        // Calculate total challenges
        const queryTC = `SELECT count(c.uid) as totalChallenges FROM assignment_detail ad JOIN challenge c ON ad.challenge_uid = c.uid WHERE ad.assignment_uid = '${assignment_uid}' GROUP BY ad.assignment_uid`;
        const [resultTC] = await db.execute(queryTC);
        resultA[0].totalChallenges = resultTC[0]?.totalChallenges
            ? resultTC[0].totalChallenges
            : 0;

        // Get its challenges
        const queryC = `SELECT c.uid, c.name, c.description FROM assignment_detail ad JOIN challenge c ON ad.challenge_uid = c.uid WHERE ad.assignment_uid = '${assignment_uid}'`;
        const [resultC] = await db.execute(queryC);
        resultA[0].challenges = resultC ? resultC : [];

        return res.status(200).json({
            status: "success",
            message: "detail  an assignment",
            data: resultA[0],
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};
