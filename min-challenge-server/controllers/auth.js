/**
 * Processing Account controller
 */

import bcrypt from "bcryptjs"
import * as vAccount from "./validation/account.js"
import * as utility from "../utils/structure.js"
import * as mAccount from "../models/account.js"
import * as mCommon from "../models/common.js"

/**
 * Register controller
 * @param {function} req request callback
 * @param {function} res response callback
 * @returns {object} res.json()
 */
export const register = async (req, res) => {
    
    const { email, password } = req.body
    const payload = { email, password }

    const [isSuccess, responsedData] = vAccount.checkAccountResponse(payload)
    if (!isSuccess)
        return res.json(utility.getReturnObject("fail", responsedData))

    const emailCheckingResult = await mAccount.checkNotExist(email)
    console.log(emailCheckingResult);
    if (emailCheckingResult.status == "success") {
        // Hash the password
        const salt = bcrypt.genSaltSync(10)
        payload.password = bcrypt.hashSync(password, salt)
        const createResult = await mCommon.create("account", payload, "User has been created.")
        return res.json(createResult)
    } 
    else {
        return res.json(emailCheckingResult)
    }
}