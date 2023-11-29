import { body, validationResult } from "express-validator";
import db from "../models/db.js";
// Middleware for Sign Up API
export const validateUserSignUp = [
    (req, res, next) => {
        // Trim spaces from the input data
        req.body.username = req.body?.username?.trim();
        req.body.email = req.body?.email?.trim();
        req.body.password = req.body?.password?.trim();
        next();
    },
    async (req, res, next) => {
        const { username, email } = req.body;

        // Define a regular expression to match special characters
        const specialCharRegex = /[.,\/?\\$£@#!%^&*;:{}=\-_`~()]/g;

        // Check if the input string contains any special characters
        if (specialCharRegex.test(username)) {
            // Special characters found, alert or handle as needed
            return res.status(400).json({
                status: "fail",
                message: "Special characters not allowed in Username",
            });
        }

        // Check username
        const checkUserQuery = `SELECT * FROM account WHERE username = '${username}'`;
        try {
            const [usernameResults] = await db.execute(checkUserQuery);
            if (usernameResults?.length > 0) {
                return res.status(400).json({
                    status: "fail",
                    message: "Username already in use",
                });
            }
        } catch (usernameError) {
            console.error(usernameError);
            return res.status(500).json({
                status: "error",
                message: `Internal error server: ${usernameError.message}`,
            });
        }

        // Check email
        const checkEmailQuery = `SELECT * FROM account WHERE email = '${email}'`;
        try {
            const [emailResults] = await db.execute(checkEmailQuery);
            if (emailResults?.length > 0) {
                return res.status(400).json({
                    status: "fail",
                    message: "Email already in use",
                });
            }
        } catch (emailError) {
            console.error(emailError);
            return res.status(500).json({
                status: "error",
                message: `Internal error server: ${emailError.message}`,
            });
        }
        // If neither username nor email exists, call next() to proceed
        next();
    },
    // Define validation rules for each field
    body("username")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters long"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: errors.array(),
            });
        }
        next(); // No validation errors, proceed to the next middleware or route
    },
];

// Middleware for Sign In API
export const validateUserSignIn = async (req, res, next) => {
    let { signInName } = req.body;
    signInName = signInName?.trim();
    // Check if the inputString matches either email or username
    const query = `SELECT * FROM account WHERE email = '${signInName}' OR username = '${signInName}'`;
    try {
        const [results] = await db.execute(query);
        if (results?.length === 0) {
            return res.status(401).json({
                status: "fail",
                message: "User not found",
            });
        }
        // Attach the user object to the request for later use in the handleSignIn
        req.user = results[0];
        next();
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: `Internal Server Error: ${error.message}`,
        });
    }
};
