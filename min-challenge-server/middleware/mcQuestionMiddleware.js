import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { stringify as uuidStringify } from "uuid";

export const checkValidToken = (req, res, next) => {
    // Get the 'Authorization' header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }
    const tokenParts = authHeader.split(" ");

    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(401).json({ error: "Invalid token format" });
    }
    const tokenValue = tokenParts[1];
    // Verify and Decode Creator UID from token
    jwt.verify(tokenValue, "LTT-secret-key", (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token has expired" });
            }
        }
        // Parse userId
        req.userId = uuidStringify(decoded.userId.data);
        next();
    });
};

export const checkEmptyMCQ = (req, res, next) => {
    const listQuestion = req.body;
    // Function for checking null value
    function hasEmptyValue(obj) {
        for (const key in obj) {
            if (obj[key] === "") {
                return true;
            }
            if (typeof obj[key] === "object") {
                if (hasEmptyValue(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    }

    let hasEmptyValueFlag = false;
    for (const question of listQuestion) {
        if (hasEmptyValue(question)) {
            hasEmptyValueFlag = true;
            break;
        }
    }

    if (hasEmptyValueFlag) {
        return res
            .status(401)
            .json({ error: "Error: Some properties have empty string values" });
    } else {
        next();
    }
};
//
export const checkQuestionExistent = (req, res, next) => {
    const question_uid = req.body[0].question_uid;
    let question_uid_trim = question_uid.trim();
    let q = `select \`uid\` from question where account_uid = UUID_TO_BIN('${req.userId}')`;
    db.query(q, (error, result) => {
        let listQuestion = result.filter((question) => {
            return question.uid === question_uid_trim;
        });
        if (listQuestion.length != 0) {
            req.question_uid = question_uid_trim;
            next();
        } else {
            return res.status(401).json({ error: "Question is not existent" });
        }
    });
};
