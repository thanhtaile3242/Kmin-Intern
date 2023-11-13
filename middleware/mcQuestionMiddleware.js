import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { stringify as uuidStringify } from "uuid";
import {
    removeSpecialCharactersAndTrim,
    removeVietnameseDiacritics,
} from "../utils/utils_MCQ.js";
// Middleware for multiple choice questions
export const checkValidToken = async (req, res, next) => {
    try {
        // Get the 'Authorization' key from header
        const authHeader = req.headers.authorization;
        // Check the received token
        if (!authHeader) {
            return res.status(401).json({ error: "No token provided" });
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({ error: "Invalid token format" });
        }

        const tokenValue = tokenParts[1];
        // Verify and Decode Creator UID from token using async/await
        const decodedData = await jwt.verify(tokenValue, "LTT-secret-key");
        // Attach userId to req object
        req.userId = decodedData.userId;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token has expired" });
        } else {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; //

export const checkEmptyMCQ = (req, res, next) => {
    // Extract the list question
    const listQuestion = req.body;
    // Function for checking "" value of an array
    function hasEmptyStringProperty(array) {
        // Helper function to check if an object has any property with an empty string
        function checkObject(obj) {
            for (const key in obj) {
                if (typeof obj[key] === "string" && obj[key] === "") {
                    return true; // Found an empty string
                } else if (typeof obj[key] === "object" && obj[key] !== null) {
                    // Recursively check nested objects and arrays
                    if (checkObject(obj[key])) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Iterate through the array and check each object
        for (const item of array) {
            if (checkObject(item)) {
                return true; // Found an object with an empty string property
            }
        }
        return false; // No empty string properties found
    }
    // Create the flag
    const isNullValueFlag = hasEmptyStringProperty(listQuestion);
    if (isNullValueFlag) {
        return res
            .status(401)
            .json({ error: "Error: Some properties have empty string values" });
    } else {
        next();
    }
}; //

export const checkQuestionExistent = async (req, res, next) => {
    const question_uid = req.params.id.trim();
    // Prepare the query using placeholders for parameters
    let query = `SELECT * FROM question WHERE uid = '${question_uid}' AND is_deleted = '0'`;

    try {
        // Execute the query with the question_uid parameter
        let [result, fields] = await db.execute(query);

        if (result.length !== 0) {
            // If the question exists, attach the question_uid to the request object and call next middleware
            next();
        } else {
            // If the question does not exist, return an error response
            return res.status(401).json({ error: "Question is not existent" });
        }
    } catch (error) {
        // If there's an error during the database operation, catch it and return an error response
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}; //

export const checkFilterEmpty = (req, res, next) => {
    // Handle keyword
    let keyWord = req.body.filter;
    keyWord = removeSpecialCharactersAndTrim(keyWord);
    keyWord = removeVietnameseDiacritics(keyWord);
    if (!keyWord) {
        return res.status(400).json({ error: "Empty keyword provided." });
    } else {
        req.keyWord = keyWord;
        next();
    }
}; //

export const checkLimitOfMCQ = (req, res, next) => {
    const data = req.body;
    // Check if having more than 10 questions
    const hasMoreThanFiveObjects = data.length > 10;
    // Check if having more than 10 answers in each question
    const hasAnswerWithMoreThanThreeObjects = data.some(
        (item) => item.answers.length > 10
    );

    if (hasMoreThanFiveObjects) {
        return res.status(400).json({ error: "Having more than 10 questions" });
    }
    if (hasAnswerWithMoreThanThreeObjects) {
        return res.status(400).json({ error: "Having more than 10 answers" });
    }
    next();
}; //
