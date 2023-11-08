/**
 * Common function for model
 */
import { getInsertQuery, getReturnObject } from "../utils/structure.js";
import db from "./db.js"

/**
 * Create an instance (insert a record to a table)
 * @param {string} table The table will be inserted a record
 * @param {object} payload Data need to be inserted
 * @param {string} successMessage message will be send if success
 * @returns {object} ReturnObject
 */
export const create = async (table, payload, successMessage) => {
    let result = {}
    const q = getInsertQuery(table, payload, true)

    await new Promise((resolve, reject) => {
        db.query(q, (err, data) => {
            if (err) {
                result = getReturnObject("error", { err })
            }
            else {
                result = getReturnObject("success", successMessage)
            }
            resolve(result)
        })
    })
    return result
}