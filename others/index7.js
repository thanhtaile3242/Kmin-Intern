import crypto from "crypto";

const token = crypto.randomBytes(32).toString("hex");
console.log(token);
