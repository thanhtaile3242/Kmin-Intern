import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { stringify as uuidStringify } from "uuid";

export const checkQuestionExistent = async (req, res, next) => {
    try {
        const question_uid = req.params.id.trim();
        const userId = req.userId;
        // Prepare the query using placeholders for parameters
        let query = `SELECT * FROM question WHERE account_uid = UUID_TO_BIN('${userId}')  AND uid = '${question_uid}' AND is_deleted = '0'`;
        // Execute the query with the question_uid parameter
        let [result, fields] = await db.execute(query);

        if (result.length !== 0) {
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
            message: "Internal server error",
        });
    }
};

export const checkLimitOfMCQ = (req, res, next) => {
    const data = req.body;
    // Check if having more than 10 questions
    const hasMoreThanFiveObjects = data.length > 10;
    // Check if having more than 10 answers in each question
    const hasAnswerWithMoreThanThreeObjects = data.some(
        (item) => item.answers.length > 10
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

// export const checkFields = (requiredFields) => {
//     return function (req, res, next) {
//         const clientData = req.body;
//         const clientField = new Set(extractUniqueFields(clientData));
//         console.log(clientField);
//         for (const item of requiredFields) {
//             if (!clientField.has(item)) {
//                 return res.send(`Missing ${item}`);
//             }
//         }
//         next();
//     };
// };
