// let D1 = [
//     {
//         question_uid: "1",
//         Answers: [
//             {
//                 answer_uid: "A1",
//                 correct: 1,
//             },
//             {
//                 answer_uid: "A2",
//                 correct: 0,
//             },
//             {
//                 answer_uid: "A3",
//                 correct: 1,
//             },
//             {
//                 answer_uid: "A4",
//                 correct: 0,
//             },
//         ],
//     },
//     {
//         question_uid: "2",
//         Answers: [
//             {
//                 answer_uid: "B1",
//                 correct: 0,
//             },
//             {
//                 answer_uid: "B2",
//                 correct: 0,
//             },
//             {
//                 answer_uid: "B3",
//                 correct: 0,
//             },
//             {
//                 answer_uid: "B4",
//                 correct: 1,
//             },
//         ],
//     },
//     {
//         question_uid: "3",
//         Answers: [
//             {
//                 answer_uid: "C1",
//                 correct: 1,
//             },
//             {
//                 answer_uid: "C2",
//                 correct: 1,
//             },
//             {
//                 answer_uid: "C3",
//                 correct: 0,
//             },
//             {
//                 answer_uid: "C4",
//                 correct: 1,
//             },
//         ],
//     },
// ];

const a = [
    "98aec273-2369-4a86-b9cc-a34a6d09b631",
    "9931e531-2a34-4229-8e39-1c6eb71666c1",
    "9a6854a1-e97b-420d-b924-01fd250da0b6",
];

const b = [
    "9931e531-2a34-4229-8e39-1c6eb71666c1",
    "98aec273-2369-4a86-b9cc-a34a6d09b631",
    "9a6854a1-e97b-420d-b924-01fd250da0b6-c",
];

const arraysEqual = (a, b) => {
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

arraysEqual(a, b);

const challengeResult = (clientData, systemData) => {
    if (clientData.challenge_uid !== systemData.challenge_uid) {
        throw new Error("Challenge UIDs do not match");
    }

    let result = {
        challenge_uid: clientData.challenge_uid,
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
                arraysEqual(question.userAnswer, systemQuestion.correctAnswer)
            ) {
                result.totalCorrect++;
                result.correctQuestions.push({
                    question_uid: question.question_uid,
                    correctAnswer: systemQuestion.correctAnswer,
                });
            } else {
                result.totalWrong++;
                result.wrongQuestions.push({
                    question_uid: question.question_uid,
                    correctAnswer: systemQuestion.correctAnswer,
                    userAnswer: question.userAnswer,
                });
            }
        }
    });

    return result;
};
