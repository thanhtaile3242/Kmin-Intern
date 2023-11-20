function getDuplicateWords(arr) {
    const wordCount = {};

    // Count occurrences of words in the array
    for (const sentence of arr) {
        const words = sentence.split(" ");

        const uniqueWords = new Set(); // To store unique words in each sentence

        for (const word of words) {
            // Normalize the word to lowercase for case-insensitive comparison
            const normalizedWord = word.toLowerCase();

            if (!uniqueWords.has(normalizedWord)) {
                uniqueWords.add(normalizedWord); // Add unique words to the set
                if (wordCount[normalizedWord]) {
                    wordCount[normalizedWord]++;
                } else {
                    wordCount[normalizedWord] = 1;
                }
            }
        }
    }

    // Filter words that appear two times or more in the array
    const duplicates = Object.keys(wordCount).filter(
        (word) => wordCount[word] >= 2
    );

    // Reconstruct the string with duplicate words
    const result = duplicates.join(" ");

    return result;
}

const array = [
    "toán 12 đại số chương 1",
    "toán 12 hàm số",
    "biến thiên hàm số",
    "toán cực trị hàm số",
    "toán giá trị cực tiểu của hàm số",
    "hàm số liên tục cực đại",
];

// const duplicateWordsString = getDuplicateWords(array);
// console.log(duplicateWordsString); // Output: "toán 12 hàm số của"
// Function to change the first character of every word to uppercase

// Function to convert to turbo's notation
function convertToTurbo(str) {
    const arr = str.split(" ");
    var result = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i + 1]) {
            if (
                arr[i].charAt(0) === "l" &&
                arr[i + 1].substring(0, 2) === "th"
            ) {
                result.push(titleCase(arr[i] + " " + arr[i + 1]));
                i++;
            } else {
                result.push(titleCase(arr[i]));
            }
        } else {
            result.push(titleCase(arr[i]));
        }
    }
    return result.join(" ");
}

// get nouns from a string
function getNouns(str) {
    var result = str.match(
        /([a-zA-ZĐđÁáÀàẢảÃãẠạẤấẦầẨẩẪẫẬậăắặẳẵằêếềễểệÓóÒòỎỏÕõỌọôốồổỗộƠơỚớỜờỞởỠỡỢợÚúÙùỦủŨũỤụƯưỨứỪừỬửỮữựÍíÌìỈỉĨĨỊịÝýỲỳỶỷỸỹỴỵ]+[a-zđáàảãạấầẩẫậăắặẳẵằêếềễểệóaòỏõọốồổỗộơớờởỡợúùủũụưứừửữựíìỉĩịýỳỷỹỵ]*)/gi
    );
    if (result) {
        return convertToTurbo(result.join(" "));
    } else {
        return null;
    }
}

// test string
var str = "lê thành tài long an tại việt nam";
console.log(getNouns(str));
