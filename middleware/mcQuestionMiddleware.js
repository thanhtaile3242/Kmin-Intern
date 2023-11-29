import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { stringify as uuidStringify } from "uuid";

export const checkQuestionExistent = async (req, res, next) => {
    const userId = req?.userId;
    const question_uid = req.params?.id?.trim();
    try {
        // Prepare the query using placeholders for parameters
        const query = `SELECT * FROM question WHERE creator_uid = UUID_TO_BIN('${userId}')  AND uid = '${question_uid}' AND is_deleted = '0'`;
        // Execute the query with the question_uid parameter
        const [result] = await db.execute(query);

        if (result?.length !== 0) {
            // If the question exists, attach the question_uid to the request object and call next middleware
            next();
        } else {
            // If the question does not exist, return an error response
            return res.status(401).json({
                status: "fail",
                message: "Question is not existent",
            });
        }
    } catch (error) {
        // If there's an error during the database operation, catch it and return an error response
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal server error: ${error.message}`,
        });
    }
};

export const checkLimitOfMCQ = (req, res, next) => {
    const data = req.body;
    // Check if having more than 10 questions
    const hasMoreThanFiveObjects = data?.length > 50;
    // Check if having more than 10 answers in each question
    const hasAnswerWithMoreThanThreeObjects = data.some(
        (item) => item?.answers?.length > 20
    );

    if (hasMoreThanFiveObjects) {
        return res.status(400).json({
            status: "fail",
            message: "Having more than 10 questions",
        });
    }
    if (hasAnswerWithMoreThanThreeObjects) {
        return res.status(400).json({
            status: "fail",
            message: "Having more than 10 answers",
        });
    }
    next();
};
