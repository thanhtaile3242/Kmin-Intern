function normalizeVietnameseWord(word) {
    return word
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

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

const inputString = "toán 12 toán đại số";
const uniqueWordsResult = extractUniqueWords(inputString);
console.log(uniqueWordsResult); // Output: "lịch sử Việt Nam chương 10"
