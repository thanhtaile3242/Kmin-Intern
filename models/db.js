/**
 * DB connection
 */

// import * as dotenv from 'dotenv'
// import mysql from "mysql"

// dotenv.config()
// export const db = mysql.createConnection({
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASS,
//     database: process.env.DATABASE_NAME ,
// })

import * as dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();
const db = await mysql.createPool({
    host: "localhost",
    user: "root",
    port: "3306",
    password: "123456789",
    database: "kmin2",
});
export default db;
