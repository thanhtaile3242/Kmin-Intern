import jwt from "jsonwebtoken";
import db from "../models/db.js";
import { stringify as uuidStringify } from "uuid";

// Middleware for checking valid provided token from client
export const authentication = async (req, res, next) => {
    try {
        // Get the 'Authorization' key from header
        const authHeader = req.headers.authorization;
        // Check the received token
        if (!authHeader) {
            return res.status(401).json({
                status: "fail",
                message: "No token provided",
            });
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({
                status: "fail",
                message: "Invalid token format",
            });
        }

        const tokenValue = tokenParts[1];
        // Verify and Decode Creator UID from token using async/await
        const decodedData = await jwt.verify(tokenValue, "LTT-secret-key");
        // Attach userId to req object
        req.userId = decodedData.userId;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                status: "fail",
                message: "Invalid token format",
            });
        } else {
            console.error(error);
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error",
            });
        }
    }
};
// Middleware for checking empty fields in client-sent data
export const checkEmptyData = (req, res, next) => {
    // Extract the list question
    const listData = req.body;
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
    const isNullValueFlag = hasEmptyStringProperty(listData);
    if (isNullValueFlag) {
        return res.status(401).json({
            status: "fail",
            message: "Some properties have empty string values",
        });
    } else {
        next();
    }
};
