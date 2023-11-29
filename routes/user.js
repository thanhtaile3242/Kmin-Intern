import express from "express";
import db from "../models/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/sendMail.js";
const router = express.Router();
// Controller
import * as userController from "../controllers/userController.js";
// Middleware
import * as userMiddleware from "../middleware/userMiddleware.js";

// API sign up
router.post(
    "/signup",
    [
        userMiddleware.validateUserSignUp,
        userMiddleware.checkSpecialCharactersInUsername,
        userMiddleware.checkExistentAccount,
    ],
    userController.handleSignUp
);
// API sign in
router.post(
    "/signin",
    [userMiddleware.validateUserSignIn],
    userController.handleSignIn
);
// API account
router.get("/account", async (req, res) => {
    try {
        // Get the 'Authorization' key from header
        const bearerToken = req.headers.authorization;
        // Check the received token
        if (!bearerToken) {
            return res.status(401).json({
                status: "fail",
                message: "No access_token provided",
            });
        }
        // Get access_token
        const tokenParts = bearerToken.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({
                status: "fail",
                message: "Invalid token format",
            });
        }
        const access_token = tokenParts[1];
        const decodedData = await jwt.verify(
            access_token,
            "LTT-secret-key-access"
        );
        // Get user via access_token
        const email = decodedData.email;
        const query = `SELECT email, username FROM account WHERE email = '${email}'`;
        const [user] = await db.execute(query);
        return res.status(200).json({
            status: "success",
            message: "Get user information",
            data: user,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});
// API refresh token
router.get("/refresh", async (req, res) => {
    try {
        const refresh_token = req.cookies["refresh_token"];
        const query = `SELECT username, email FROM account WHERE refresh_token = '${refresh_token}'`;
        const [user] = await db.execute(query);
        if (user) {
            const { username, email } = user;
            const payload = {
                username: username,
                email: email,
            };
            const access_token = jwt.sign(payload, "LTT-secret-key-access", {
                expiresIn: "1h",
            });
            const refresh_token = jwt.sign(payload, "LTT-secret-key-refresh", {
                expiresIn: "3h",
            });

            // Cập nhật refresh token vào database
            try {
                await db.beginTransaction();
                const queryRF = `UPDATE account SET refresh_token = '${refresh_token}' WHERE email = '${email}'`;
                await db.execute(queryRF);
                await db.commit();
            } catch (error) {
                await db.rollback();
                console.error(error);
                return res.status(500).json({
                    status: "error",
                    message: "Internal server error",
                });
            }

            // Set refresh_token as Cookie
            res.clearCookie("refresh_token");
            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: 3600 * 3 * 1000,
            });
            return res.status(200).json({
                status: "success",
                data: {
                    access_token,
                    username,
                    email,
                },
            });
        } else {
            return res.status(400).json({
                status: "fail",
                message: "refresh token Invalid",
            });
        }
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});
// API log out
router.post("/logout", async (req, res) => {
    try {
        // Get the 'Authorization' key from header
        const bearerToken = req.headers.authorization;
        // Check the received token
        if (!bearerToken) {
            return res.status(401).json({
                status: "fail",
                message: "No access_token provided",
            });
        }
        // Get access_token
        const tokenParts = bearerToken.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({
                status: "fail",
                message: "Invalid token format",
            });
        }
        const access_token = tokenParts[1];
        const decodedData = await jwt.verify(
            access_token,
            "LTT-secret-key-access"
        );
        // Get email via access_token
        const email = decodedData.email;
        // Update null for refresh_token field
        await db.beginTransaction();
        const query = `UPDATE account SET refresh_token = null WHERE email = '${email}'`;
        await db.execute(query);
        // Delete refresh_token in Cookie
        res.clearCookie("refresh_token");
        await db.commit();
        // Return
        return res.status(200).json({
            status: "success",
            message: "Log out successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});
// API forget password
router.post("/forget", async (req, res) => {
    const email = req.query.email;
    const query = `SELECT email, username FROM account WHERE email = '${email}'`;
    const [user] = await db.execute(query);
    if (user) {
        const payload = {
            username: user[0].username,
            email: user[0].email,
        };
        const resetPasswordToken = jwt.sign(
            payload,
            "LTT-secret-key-reset-password",
            {
                expiresIn: "5m",
            }
        );

        //
        try {
            await db.beginTransaction();
            const queryRP = `UPDATE account SET reset_password_token = '${resetPasswordToken}' WHERE email = '${email}'`;
            await db.execute(queryRP);
            await db.commit();
        } catch (error) {
            await db.rollback();
            console.error(error);
            return res.status(500).json({
                status: "error",
                message: "Internal server error",
            });
        }
        //

        const html = `Click to the link for reset password, this link will be expired in 15 minutes.
        <a href = "http://localhost:8800/api/user/${resetPasswordToken}">Click Here</a>`;
        sendMail(email, html);
        return res.status(200).json({
            data: "Email is sent !!!",
        });
    } else {
    }
});
// Check resetPasswordToken
router.get("/:resetPasswordToken", async (req, res) => {
    try {
        const resetPasswordToken = req.params.resetPasswordToken;

        const query = `SELECT email, reset_password_token, username FROM account WHERE reset_password_token = '${resetPasswordToken}'`;
        const [result] = await db.execute(query);
        if (!result)
            return res
                .status(400)
                .json({ status: "fail", message: "user not found" });
        return res.status(200).json({
            status: "success",
            message: "Allow user change password",
            email: result[0].email,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Invalid token",
        });
    }
});

//
router.put("/reset-password", async (req, res) => {
    try {
        const email = req.body[0].email;
        const newPassword = req.body[0].newPassword;
        const repeatedPassword = req.body[0].repeatedPassword;
        if (newPassword !== repeatedPassword)
            return res.status(400).json({
                status: "fail",
                message: "Unmatching password",
            });
        try {
            // Hash password by bcrypt library
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            await db.beginTransaction();
            const query1 = `UPDATE account SET password = '${hashedPassword}' WHERE email = '${email}'`;
            await db.execute(query1);
            await db.commit();
        } catch (error) {
            await db.rollback();
            console.error(error);
            return res.status(400).json({
                status: "error",
                message: error.message,
            });
        }

        try {
            await db.beginTransaction();
            const query2 = `UPDATE account SET reset_password_token = null WHERE email = '${email}'`;
            await db.execute(query2);
            await db.commit();
        } catch (error) {
            await db.rollback();
            console.error(error);
            return res.status(400).json({
                status: "error",
                message: error.message,
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Update password successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

export default router;
