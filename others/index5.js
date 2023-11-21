function normalizeVietnameseWord(word) {
    return word
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
const removeSpecialCharactersAndTrim = (inputString) => {
    // Define a regular expression to match special characters
    const regex = /[.,\/?\\$£@#!%^&*;:{}=\-+_`~()]/g;

    // Use the replace method to remove special characters from the input string
    const resultString = inputString.replace(regex, "");

    // Use the trim method to remove leading and trailing whitespace
    const trimmedString = resultString.trim();

    return trimmedString;
};

function extractUniqueWords(inputString) {
    const wordsArray = inputString.split(" ");

    const uniqueWordsMap = new Map();
    console.log(uniqueWordsMap);
    for (const word of wordsArray) {
        const normalizedWord = normalizeVietnameseWord(word);

        // If the normalized word doesn't exist in the Map, or it exists but with a different case
        if (
            !uniqueWordsMap.has(normalizedWord) ||
            uniqueWordsMap.get(normalizedWord).toLowerCase() !==
                word.toLowerCase()
        ) {
            uniqueWordsMap.set(normalizedWord, word);
        }
    }

    const uniqueWordsString = Array.from(uniqueWordsMap.values()).join(" ");

    return uniqueWordsString;
}

const inputString = "lịch sử 12; lịch sử Việt Nam; Việt Nam năm 1980";
const uniqueWordsResult = extractUniqueWords(inputString);

console.log(removeSpecialCharactersAndTrim(uniqueWordsResult)); // Output: "lịch sử Việt Nam chương 10"
