function extractUniqueFields(arr) {
    const uniqueFields = new Set();

    function getFields(obj) {
        if (typeof obj !== "object" || obj === null) {
            return;
        }

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (!Number.isNaN(Number(key))) {
                    // Skip array indices
                    getFields(obj[key]);
                } else {
                    uniqueFields.add(key);
                    getFields(obj[key]);
                }
            }
        }
    }

    arr.forEach((obj) => {
        getFields(obj);
    });
    return Array.from(uniqueFields);
}

const data = [
    {
        uid: "abc",
        name: "name ne",
        description: "description",
        answers: [
            {
                aUID: "aaa111",
                noidung: [
                    {
                        correct: 1,
                        order: "a1",
                    },
                ],
            },
            {
                aUID: "aaa111",
                noidung: "bc",
                lethanhtai: 1111,
            },
        ],
    },
];

const requiredFields = extractUniqueFields(data);

let requireServer = new Set(requiredFields);

let clientField = [
    "uid",
    "aUID",
    "name",
    "description",
    "answers",
    "noidung",
    "correct",
    "order",
    "lethanhtai",
];
function check() {
    let clientSet = new Set(clientField);
    for (const item of requiredFields) {
        if (!clientSet.has(item)) {
            return `Missing ${item}`;
        }
    }
    return "OK";
}

console.log(check());
