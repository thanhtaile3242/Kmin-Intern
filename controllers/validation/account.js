/**
 * Validating Account
 */

import * as vCommon from "./common.js"

export const checkEmail = (email) => {
    const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g
    return email.match(validRegex)
}

export const checkPassword = (password) => {
    return password.length >= 6
}

export const checkName = (name) => {
    return name.length >= 1
}

export const checkPhoneNumber = (phoneNumber) => {
    const validRegex = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/g
    return phoneNumber.match(validRegex)
}

export const checkAvarta = (avarta) => {
    return true
}

export const checkAccType = (accType) => {
    return true
}

const validators = {
    email: checkEmail,
    username: checkName,
    phoneNumber: checkPhoneNumber,
    password: checkPassword,
    firstName: checkName,
    middleName: checkName,
    lastName: checkName,
    avarta: checkAvarta,
    accType: checkAccType,
}

/**
 * validate account and return valid and unvalid field
 * @param {object} account data need to check
 * @returns {object} validation reult of each field
 */
export const checkAccount = (account) => {
    const res = {}
    for (const key in account) {
        const value = account[key]
        const validator = validators[key]
        if (validator(value))
            res[key] = "OK"
        else
            res[key] = `Error: ${key} is invalid.`
    }

    return res
}

/**
 * validate account and return data invalid as a response data
 * @param {object} account data need to check
 * @returns {object} response data
 */
export const checkAccountResponse = (account) => {
    const validResult = checkAccount(account)
    const responseData = vCommon.getResponseData(validResult)
    return responseData
}