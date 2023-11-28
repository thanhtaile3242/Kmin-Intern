import { crypto } from "crypto-js";

const token = crypto.randomBytes(20).toString("hex");
console.log(token);
