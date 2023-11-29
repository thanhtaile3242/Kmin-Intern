import db from "../models/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { v5 as uuidv5 } from "uuid";
import { v4 as uuidv4 } from "uuid";
import { stringify as uuidStringify } from "uuid";
const redis = new Redis();
// For generate a uuid key
const SECRET_UUID = "3216f1e5-3cb8-42e7-8a1b-c8595798bab6";

// Controller for API sign in a new user
export const handleSignUp = async (req, res) => {
    let { username, email, password } = req.body;
    email = email?.toLowerCase();
    try {
        await db.beginTransaction();
        // Generate uuid from SECRET_UUID and email from v5(uuid library).
        const uuid = uuidv5(email.toLowerCase(), SECRET_UUID);
        // Hash password by bcrypt library
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Create query statement to insert into account table
        const query = `INSERT INTO account (\`uid\`, \`email\`, \`username\`, \`password\`) VALUES (UUID_TO_BIN('${uuid}'), '${email}', '${username}', '${hashedPassword}')`;
        // Insert action execution
        await db.execute(query);
        await db.commit();
        // Return for client-side
        return res.status(201).json({
            status: "success",
            message: "User created successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal server error: ${error.message}`,
        });
    }
};

// Controller for API sign up an existent user
export const handleSignIn = async (req, res) => {
    try {
        const { user, body } = req;
        const email = user.email;
        const username = user.username;
        const parseUUID = uuidStringify(user.uid);
        const payload = { userId: parseUUID, username: username, email: email };
        const maxAttempts = 5;
        const lockoutTime = 120;
        const lockoutKey = `lockout: ${username}`;
        const attemptsKey = `attempts: ${username}`;

        // Check if the account is locked
        const isLock = await redis.get(lockoutKey);
        if (isLock) {
            const remainingTime = await redis.ttl(lockoutKey);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            if (remainingTime > 0 && minutes > 0) {
                return res.status(403).json({
                    status: "fail",
                    message: `Account is locked. Please try again after ${minutes} minutes and ${seconds} seconds`,
                });
            }
            if (remainingTime > 0 && minutes <= 0) {
                return res.status(403).json({
                    status: "fail",
                    message: `Account is locked. Please try again after ${seconds} seconds.`,
                });
            } else {
                await redis.del(lockoutKey, attemptsKey);
            }
        }
        // Check of matching password
        const isMatch = await bcrypt.compare(body.password, user.password);
        if (isMatch) {
            await redis.del(attemptsKey);
            // Generate access_token and refresh_token
            const access_token = jwt.sign(payload, "LTT-secret-key-access", {
                expiresIn: "1h",
            });
            const refresh_token = jwt.sign(payload, "LTT-secret-key-refresh", {
                expiresIn: "3h",
            });

            // Save refresh_token into database
            await db.beginTransaction();
            const queryRF = `UPDATE account SET refresh_token = '${refresh_token}' WHERE email = '${email}'`;
            await db.execute(queryRF);
            await db.commit();

            // Set refresh_token as Cookie
            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: 3600 * 3 * 1000,
            });
            // Return
            return res.status(200).json({
                status: "success",
                message: "Sign in successfully",
                data: { ...payload, ...{ access_token } },
            });
        } else {
            let attempts = await redis.incr(attemptsKey);
            if (attempts === maxAttempts) {
                // Lock the account and set a timer
                await redis.setex(lockoutKey, lockoutTime, "locked");
            }
            return res.status(401).json({
                status: "fail",
                message: "Wrong password",
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal server error: ${error.message}`,
        });
    }
};

// Controller for API get a user via access_token
export const handleGetAccount = async (req, res) => {
    try {
        // Get user via uid in access_token
        const userId = req.userId;
        const query = `SELECT email, username FROM account WHERE uid = UUID_TO_BIN('${userId}')`;
        const [user] = await db.execute(query);
        if (user) {
            return res.status(200).json({
                status: "success",
                message: "Get user information",
                data: user,
            });
        } else {
            return res.status(400).json({
                status: "fail",
                message: "User not found",
                data: [],
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal Server Error: ${error.message}`,
        });
    }
};

// Controller for API refresh access_token and refresh_token (when access_token expired)
export const handleRefreshToken = async (req, res) => {
    // Get current refresh_token via Cookies
    const refresh_token = req.cookies["refresh_token"];
    try {
        await db.beginTransaction();
        // Get a user by current refresh_token
        const query = `SELECT username, email, uid FROM account WHERE refresh_token = '${refresh_token}'`;
        const [user] = await db.execute(query);
        if (user) {
            // Generate payload
            const userId = uuidStringify(user[0].uid);
            const { username, email } = user[0];
            const payload = { userId, username, email };
            // Generate a new access_token and a new refresh_token
            const access_token = jwt.sign(payload, "LTT-secret-key-access", {
                expiresIn: "1h",
            });
            const refresh_token = jwt.sign(payload, "LTT-secret-key-refresh", {
                expiresIn: "3h",
            });

            // Update refresh_token into database and Cookies
            const queryRF = `UPDATE account SET refresh_token = '${refresh_token}' WHERE email = '${email}'`;
            await db.execute(queryRF);

            res.clearCookie("refresh_token");
            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: 3600 * 3 * 1000,
            });
            await db.commit();
            // Return for client-side
            return res.status(200).json({
                status: "success",
                message: "Update access_token and refresh_token successfully",
                data: { access_token, userId, username, email },
            });
        } else {
            return res.status(400).json({
                status: "fail",
                message: "Refresh token Invalid",
            });
        }
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(400).json({
            status: "error",
            message: `Internal Server Error: ${error.message}`,
        });
    }
};

// Controller for API log out
export const handleLogOut = async (req, res) => {
    try {
        // Get userId via access_token
        const userId = req.userId;
        // Update null for refresh_token field
        await db.beginTransaction();
        const query = `UPDATE account SET refresh_token = null WHERE uid = UUID_TO_BIN('${userId}')`;
        await db.execute(query);
        // Delete refresh_token in Cookie
        res.clearCookie("refresh_token");
        await db.commit();
        // Return for client-side
        return res.status(200).json({
            status: "success",
            message: "Log out successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({
            status: "error",
            message: `Internal Server Error: ${error.message}`,
        });
    }
};

// Controller for API forget password
export const handleForgetPassword = async (req, res) => {
    try {
        const email = req.query.email;
        const query = `SELECT email, username, uid FROM account WHERE email = '${email}'`;
        const [user] = await db.execute(query);
        if (user) {
            await db.beginTransaction();
            // Generate a payload for jwt
            const userId = uuidStringify(user[0].uid);
            const { username, email } = user[0];
            const payload = { userId, username, email };
            // Generate a token for link reset password
            const resetPasswordToken = jwt.sign(
                payload,
                "LTT-secret-key-reset-password",
                {
                    expiresIn: "5m",
                }
            );
            const html = `Click to the link for reset password, this link will be expired in 15 minutes.
            <a href = "http://localhost:8800/api/user/${resetPasswordToken}">Click Here</a>`;
            // Insert reset_password_token into the account table with corresponding email
            const queryRP = `UPDATE account SET reset_password_token = '${resetPasswordToken}' WHERE email = '${email}'`;
            const [result] = await db.execute(queryRP);
            // Send email for reset password
            sendMail(email, html);
            await db.commit();
            // Return for client-side
            return res.status(200).json({
                status: "success",
                message: "Email is sent !!!",
            });
        } else {
            return res.status(400).json({
                status: "fail",
                message: "User not found",
            });
        }
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal server error: ${error.message}`,
        });
    }
};

// Controller for API check link of reset password valid or not
export const handleValidateLinkReset = async (req, res) => {
    try {
        const resetPasswordToken = req.params.resetPasswordToken;
        const query = `SELECT email, reset_password_token, username FROM account WHERE reset_password_token = '${resetPasswordToken}'`;
        const [result] = await db.execute(query);
        if (!result)
            return res
                .status(400)
                .json({ status: "fail", message: "Link expired" });
        return res.status(200).json({
            status: "success",
            message: "Allow user change password",
            email: result[0].email,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Link expired",
        });
    }
};

// Controller for API reset password from client
export const handleResetPassword = async (req, res) => {
    try {
        const { email, newPassword, repeatedPassword } = req.body[0];
        await db.beginTransaction();
        // If not matching password
        if (newPassword !== repeatedPassword)
            return res.status(400).json({
                status: "fail",
                message: "Unmatching password",
            });

        // Hash new password by bcrypt library
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        // Update new password for user
        const query1 = `UPDATE account SET password = '${hashedPassword}' WHERE email = '${email}'`;
        await db.execute(query1);
        // Update reset_password_token field to null value
        const query2 = `UPDATE account SET reset_password_token = null WHERE email = '${email}'`;
        await db.execute(query2);

        await db.commit();
        // Return for client-side
        return res.status(200).json({
            status: "success",
            message: "Update password successfully",
        });
    } catch (error) {
        await db.rollback();
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: `Internal Server Error: ${error.message}`,
        });
    }
};
