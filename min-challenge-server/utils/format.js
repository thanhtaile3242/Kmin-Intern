/**
 * Functions for formatting
 */

/**
 * Format string as capitals. 
 * Example: "vu dinh bao" => "Vu Dinh Bao"
 * @param {string} str The string needed to be capitalize
 * @returns {string} The string is capitalized
 */
export const toCapital = (str) => {
    return str.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
} 