/**
 * Functions for getting structs
 * JSend spec: https://github.com/omniti-labs/jsend
 */

/**
 * Get object to be returned acording to JSend spec
 * Example: ("success", "Account has been created") => {status: "success", data: "Account has been created"}
 * @param {string} status The status of result object, follow JSend spec, include: success, fail, error
 * @param {data} data data is returned
 * @returns {object} result object with struct as JSend spec
 */
export function getReturnObject(status, data) {
    if (status == "error")
        return {status, message: data}
    return {status, data}
}

/**
 * Get insert statement. 
 * Example ("account", {email, password}, true) => "INSERT INTO `account` (`uid`, `email`, `password`) VALUES (UUID_TO_BIN(UUID()), 'vdbao@kmin.edu.vn', '123456')"
 * @param {string} table Name of table will be inserted data
 * @param {object} payload Data will be inserted
 * @param {boolean} useUID true means this table hase used UUID, otherwise it use auto increment ID
 * @returns {strirng} query clause to inserting data
 */
export const getInsertQuery = (table, payload, useUID) => {
    let field = useUID ? "`uid`," : ""
    let value = useUID ? "UUID_TO_BIN(UUID())," : ""
    
    for (const prop in payload) {
        field += "`" + prop + "`,"
        value += "'" + payload[prop] + "',"
    }
    field = field.slice(0, -1)
    value = value.slice(0, -1)

    const q = `INSERT INTO \`${table}\` (${field}) VALUES (${value})`
    return q
}