/**
 * Utillity for validation
 */

/**
 * Get response data from validation result
 * @param {object} validResult Result of validation
 * @returns {array}
 */
export const getResponseData = (validResult) => {
    const responseData = {}
    let isSuccess = true
    for (const key in validResult) {
        if (validResult[key] != "OK") {
            responseData[key] = validResult[key]
            isSuccess = false
        }
    }
    return [isSuccess, responseData]
}