import db from "../models/db.js";
import { v4 as uuidv4 } from "uuid";
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
