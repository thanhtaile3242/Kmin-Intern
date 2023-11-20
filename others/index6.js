function getNames(str) {
    const names = [];
    let words = str.split(" ");

    for (let i = 0; i < words.length; i++) {
        if (
            words[i].match(/[\p{L}]+/gu) &&
            words[i + 1] &&
            words[i + 1].match(/[\p{L}]+/gu) &&
            words[i + 2] &&
            words[i + 2].match(/[\p{L}]+/gu)
        ) {
            // check if the word, next word and the word after the next one are Vietnamese words
            names.push(
                `${capitalize(words[i])} ${capitalize(
                    words[i + 1]
                )} ${capitalize(words[i + 2])}`
            );
            i += 2; // move the index two steps further as we have already considered the two next words
        } else if (
            words[i].match(/[\p{L}]+/gu) &&
            words[i + 1] &&
            words[i + 1].match(/[\p{L}]+/gu)
        ) {
            // If the word and next word are Vietnamese words
            names.push(`${capitalize(words[i])} ${capitalize(words[i + 1])}`);
            i += 1; // move the index one step further as we have already considered the next word
        } else if (words[i].match(/[\p{L}]+/gu)) {
            names.push(`${capitalize(words[i])}`);
        }
    }

    return names;
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

console.log(getNames("lê thành thiên tài đi long an tại việt nam"));
