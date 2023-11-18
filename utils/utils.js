// Remove Vietnamese Diacritics
export const removeVietnameseDiacritics = (str) => {
    const accents =
        "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    const nonAccents =
        "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";

    return str
        .split("")
        .map((char) => {
            const accentIndex = accents.indexOf(char);
            return accentIndex !== -1 ? nonAccents[accentIndex] : char;
        })
        .join("");
};
// Generate SQL query for search and filter (MCQ)
export const generateQuerySearchFilter = (keyword, query) => {
    const keywords = keyword.split(" ");

    const conditionClauses = keywords
        .map((kw) => `full_name COLLATE utf8mb4_unicode_520_ci LIKE '%${kw}%'`)
        .join(" AND ");
    let sqlQuery = `SELECT uid, description, name, full_name, level, tag FROM (${query}) AS subquery
    WHERE ${conditionClauses}`;

    return sqlQuery;
};
// Generate SQL query for search and filter (Challenge)
export const generateQuerySearchFilterChallenge = (keyword, query) => {
    const keywords = keyword.split(" ");

    const conditionClauses = keywords
        .map((kw) => `full_name COLLATE utf8mb4_unicode_520_ci LIKE '%${kw}%'`)
        .join(" AND ");
    let sqlQuery = `SELECT uid, description, name, full_name FROM (${query}) AS subquery
    WHERE ${conditionClauses}`;

    return sqlQuery;
};
// Count matching score
export const countMatching = (keyWord, Target) => {
    // Tách chuỗi thành mảng
    const a = keyWord.split(" ");
    const b = Target.split(" ");

    // Xử lý thuật toán trên mảng
    const lenA = a.length;
    const lenB = b.length;
    let count = 0;
    // Bắt cặp từ một phần tử ở mảng a với một phần tử ở mảng b
    for (let i = 0; i < lenA; i++) {
        for (let j = 0; j < lenB; j++) {
            if (a[i] == b[j])
                // Nếu 2 phần tử giống nhau thì tăng đếm
                count++;
        }
    }
    return count;
};
// Remove special characters
export const removeSpecialCharactersAndTrim = (inputString) => {
    // Define a regular expression to match special characters
    const regex = /[.,\/?\\$£@#!%^&*;:{}=\-+_`~()]/g;

    // Use the replace method to remove special characters from the input string
    const resultString = inputString.replace(regex, "");

    // Use the trim method to remove leading and trailing whitespace
    const trimmedString = resultString.trim();

    return trimmedString;
};
// Check 2 arrays of systemAnswers and clientAnswers
export const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;

    let aSet = new Set(a);
    let bSet = new Set(b);

    if (aSet.size !== bSet.size) return false;

    for (let item of aSet) {
        const aCount = a.filter((val) => val === item).length;
        const bCount = b.filter((val) => val === item).length;
        if (aCount !== bCount || !bSet.has(item)) return false;
    }

    return true;
};
// Get the result of challenge
export const challengeResult = (clientData, systemData) => {
    if (clientData.challenge_uid !== systemData.challenge_uid) {
        throw new Error("Challenge UIDs do not match");
    }

    let result = {
        challenge_uid: systemData.challenge_uid,
        challenge_description: systemData.challenge_description,
        totalCorrect: 0,
        totalWrong: 0,
        correctQuestions: [],
        wrongQuestions: [],
    };

    clientData["clientAnswers"].forEach((question) => {
        let systemQuestion = systemData["systemAnswers"].find(
            (x) => x.question_uid === question.question_uid
        );

        if (systemQuestion) {
            if (
                arraysEqual(question.userAnswer, systemQuestion.correctAnswers)
            ) {
                result.totalCorrect++;
                result.correctQuestions.push({
                    question_uid: question.question_uid,
                    correctAnswer: systemQuestion.correctAnswers,
                });
            } else {
                result.totalWrong++;
                result.wrongQuestions.push({
                    question_uid: question.question_uid,
                    correctAnswer: systemQuestion.correctAnswers,
                    userAnswer: question.userAnswer,
                });
            }
        }
    });

    return result;
};
