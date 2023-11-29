import db from "../models/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { v5 as uuidv5 } from "uuid";
import { v4 as uuidv4 } from "uuid";
import { stringify as uuidStringify } from "uuid";

// For generate a uuid key
const redis = new Redis();
const SECRET_UUID = "3216f1e5-3cb8-42e7-8a1b-c8595798bab6";

// Controller for API sign in a new user
export const handleSignUp = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Generate uuid from SECRET_UUID and email from v5(uuid library).
        let uuid = uuidv5(email.toLowerCase(), SECRET_UUID);
        // Hash password by bcrypt library
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Create query statement to insert into account table
        const query = `INSERT INTO account (\`uid\`, \`email\`, \`username\`, \`password\`) VALUES (UUID_TO_BIN('${uuid}'), '${email.toLowerCase()}', '${username}', '${hashedPassword}')`;
        // Insert action execution
        await db.execute(query);
        // Return for client-side
        return res.status(201).json({
            status: "success",
            message: "User created successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error: Unable to create an account",
        });
    }
};
// Controller for API sign up an existent user
export const handleSignIn = async (req, res) => {
    try {
        const { user, body } = req;
        const username = user.username;
        const maxAttempts = 5;
        const lockoutTime = 120;
        const lockoutKey = `lockout: ${username}`;
        const attemptsKey = `attempts: ${username}`;

        // check if the account is locked
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

        const isMatch = await bcrypt.compare(body.password, user.password);
        if (isMatch) {
            await redis.del(attemptsKey);
            const parseUUID = uuidStringify(user.uid);
            const token = jwt.sign({ userId: parseUUID }, "LTT-secret-key");
            return res.status(200).json({
                status: "success",
                message: "Sign in successfully",
                data: {
                    username: user.username,
                    email: user.email,
                    token: token,
                },
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
            message: "Internal server error: Unable to sign in",
        });
    }
};
