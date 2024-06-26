const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const common = require("../../model/common");
const ObjectId = mongoose.Types.ObjectId

const askQuestion = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let questionData = ctx.request.body, fileData = ctx.request.files, questionInfo, likeInfo, postFolderpath = "posts", filePath;
        if (Object.keys(questionData).length === 0 && questionData == undefined) {
            ctx.response.body = data

            return
        }
        if (fileData.length !== 0) {
            questionData.files = await common.uploadBufferToAzureBlob(fileData[0], fileData[0].mimetype)
        }
        questionInfo = await db.insertSingleDocument("question", questionData)
        if (Object.keys(questionInfo).length !== 0) {
            likeInfo = await db.insertSingleDocument("questionLike", { questionId: questionInfo._id })
            if (Object.keys(likeInfo).length !== 0) {

                return ctx.response.body = { status: 1, response: "Question added successfully" }
            }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/askQuestion - ${error.message}` }
    }
}

const deleteQuestion = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let questionData = ctx.request.body, questionInfo, updateInfo, updateNotification;
        if (Object.keys(questionData).length === 0 && questionData.data === undefined) {
            ctx.response.body = data

            return
        }
        questionData = questionData.data[0];
        questionInfo = await db.findSingleDocument("question", { _id: questionData.questionId, createdBy: questionData.userId })
        if (questionInfo == null || questionInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No question found" }
        }

        updateInfo = await db.updateOneDocument("question", { _id: questionInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {
            updateNotification = await db.updateOneDocument("notification", { postId: questionInfo._id, status: { $in: [1, 2] } }, { status: 0 })
            if (updateNotification.modifiedCount !== 0 && updateNotification.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Question deleted successfully" }
            }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/deleteQuestion - ${error.message}` }
    }
}

const postAnswer = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let answerData = ctx.request.body, questionInfo, answerInfo, updateNotification;
        if (Object.keys(answerData).length === 0 && answerData.data === undefined) {
            ctx.response.body = data

            return
        }
        answerData = answerData.data[0];
        questionInfo = await db.findSingleDocument("question", { _id: answerData.questionId })
        if (questionInfo == null || questionInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No question found" }
        }
        answerInfo = await db.insertSingleDocument("answer", answerData)
        if (Object.keys(answerInfo).length !== 0) {
            updateNotification = await db.insertSingleDocument("notification", { receiverId: questionInfo.createdBy, senderId: answerData.userId, postId: questionInfo._id, commentId: answerInfo._id, category: 5 })
            if (Object.keys(updateNotification).length !== 0) {

                return ctx.response.body = { status: 1, response: "Answer added successfully" }
            }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/postAnswer - ${error.message}` }
    }
}

const deleteAnswer = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let answerData = ctx.request.body, answerInfo, updateInfo, updateNotification;
        if (Object.keys(answerData).length === 0 && answerData.data === undefined) {
            ctx.response.body = data

            return
        }
        answerData = answerData.data[0];
        answerInfo = await db.findSingleDocument("answer", { _id: answerData.answerId, userId: answerData.userId })
        if (answerInfo == null || answerInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No answer found" }
        }
        updateInfo = await db.updateOneDocument("answer", { _id: answerInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {
            updateNotification = await db.updateOneDocument("notification", { commentId: answerInfo._id, status: { $in: [1, 2] } }, { status: 0 })
            if (updateNotification.modifiedCount !== 0 && updateNotification.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Answer deleted successfully" }
            }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/deleteAnswer - ${error.message}` }
    }
}

const addReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, answerInfo, updateInfo;
        if (Object.keys(replyData).length === 0 && replyData.data === undefined) {
            ctx.response.body = data

            return
        }
        replyData = replyData.data[0];
        answerInfo = await db.findSingleDocument("answer", { _id: replyData.answerId })
        if (answerInfo == null || answerInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No answer found" }
        }
        updateInfo = await db.updateOneDocument("answer", { _id: answerInfo._id }, { $push: { replies: { userReplied: replyData.userId, message: replyData.message } } })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply added successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/addReply - ${error.message}` }
    }
}

const deleteReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, answerInfo, updateInfo, replyInfo;
        if (Object.keys(replyData).length === 0 && replyData.data === undefined) {
            ctx.response.body = data

            return
        }
        replyData = replyData.data[0];
        answerInfo = await db.findSingleDocument("answer", { _id: replyData.answerId })
        if (answerInfo == null || answerInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No answer found" }
        }
        replyInfo = await db.findSingleDocument("answer", { _id: replyData.answerId, replies: { $elemMatch: { _id: replyData.replyId, userReplied: replyData.userId, status: 1 } } })
        if (replyInfo == null) {

            return ctx.response.body = { status: 1, response: "No reply found" }
        }
        updateInfo = await db.updateOneDocument("answer", { _id: answerInfo._id, "replies._id": replyData.replyId }, { "replies.$.status": 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply deleted successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/deleteReply - ${error.message}` }
    }
}

const getAnswersAndReplies = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let questionData = ctx.request.body, questionInfo, answersAndReplies, aggregationQuery = [];
        if (Object.keys(questionData).length === 0 && questionData.data === undefined) {
            ctx.response.body = data

            return
        }
        questionData = questionData.data[0];
        questionInfo = await db.findSingleDocument("question", { _id: questionData.questionId, status: 1 })
        if (questionInfo == null || questionInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No question found" }
        }
        aggregationQuery = [
            { $match: { $and: [{ questionId: new ObjectId(questionData.questionId) }, { status: 1 }] } },
            {
                $lookup:
                {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userData.fullName", designation: "$userData.designation", profile: "$userData.profile" }, "$$ROOT"] } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: "replies.userReplied",
                    foreignField: "_id",
                    as: 'replyUser'
                }
            },
            { $unset: ["replyUser.email", "replyUser.about", "replyUser.otp", "replyUser.state", "replyUser.country", "replyUser.role", "replyUser.status", "replyUser.password", "replyUser.dob", "replyUser.createdAt", "replyUser.updatedAt"] },
            {
                $addFields: {
                    "replies": {
                        $map: {
                            input: "$replies",
                            as: "reply",
                            in: {
                                $mergeObjects: [
                                    "$$reply",
                                    {
                                        userInfo: {
                                            $arrayElemAt: ["$replyUser", {
                                                $indexOfArray: ["$replyUser._id", "$$reply.userReplied"]
                                            }]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    "userRepliedInfo": { $map: { input: "$userRepliedInfo", as: "user", in: { fullName: "$$user.fullName" } } },
                }
            },
            { $unset: ["replies.userInfo._id"] },
            {
                $project: {
                    "userId": "$userId",
                    "answer": "$answer",
                    "answeredOn": "$answeredOn",
                    "userInfo": {
                        'fullName': { '$arrayElemAt': ['$fullName', 0] },
                        'designation': { '$arrayElemAt': ['$designation', 0] },
                        'profile': { '$arrayElemAt': ['$profile', 0] },
                    },
                    "replies": {
                        $filter: {
                            input: "$replies",
                            as: "reply",
                            cond: { $eq: ["$$reply.status", 1] }
                        }
                    }
                }
            }
        ]
        answersAndReplies = await db.getAggregation("answer", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(answersAndReplies) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/getAnswersAndReplies - ${error.message}` }
    }
}

const updateLike = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let questionData = ctx.request.body, questionInfo, likeInfo, updateNotification;
        if (Object.keys(questionData).length === 0 && questionData.data === undefined) {
            ctx.response.body = data

            return
        }
        questionData = questionData.data[0];
        questionInfo = await db.findSingleDocument("question", { _id: questionData.questionId })
        if (questionInfo == null || questionInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No question found" }
        }
        if (questionData.status === 1) {
            updateInfo = await db.updateOneDocument("questionLike", { questionId: questionInfo._id }, { $push: { likedBy: questionData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {
                updateNotification = await db.insertSingleDocument("notification", { receiverId: questionInfo._id, senderId: questionData.userId, postId: questionInfo._id, category: 4 })
                if (Object.keys(updateNotification).length !== 0) {

                    return ctx.response.body = { status: 1, response: "Like added successfully" }
                }
            }
        }
        if (questionData.status === 2) {
            updateInfo = await db.updateOneDocument("questionLike", { questionId: questionInfo._id }, { $pull: { likedBy: questionData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {
                updateNotification = await db.updateOneDocument("notification", { postId: questionInfo._id, senderId: questionData.userId, category: 4, status: { $in: [1, 2] } }, { status: 0 })
                if (updateNotification.modifiedCount !== 0 && updateNotification.matchedCount !== 0) {

                    return ctx.response.body = { status: 1, response: "Disliked successfully" }
                }
            }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/updateLike - ${error.message}` }
    }
}

const getAllQa = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let questionData = ctx.request.body, qaData, qaAggregation = [], advertisementAggregation = [], randomAdvertisment;
        if (Object.keys(questionData).length === 0 && questionData.data === undefined) {
            res.send(data)

            return
        }
        questionData = questionData.data[0];
        qaAggregation = [
            {
                $match: { status: 1 },
            },
            {
                $lookup:
                {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "userInfo",
                }
            },
            {
                $lookup:
                {
                    from: "questionlikes",
                    localField: "_id",
                    foreignField: "questionId",
                    as: "questionInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$questionInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                }
            },
            {
                $lookup: {
                    from: "answers",
                    localField: "_id",
                    foreignField: "questionId",
                    as: "questionAnswers",
                }
            },
            {
                $project: {
                    "createdBy": "$createdBy",
                    "question": "$question",
                    "files": "$files",
                    "createdAt": "$createdAt",
                    "totalAnswers": { "$size": "$questionAnswers" },
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    "likedBy": { '$arrayElemAt': ['$likedBy', 0] },
                    "likes":
                    {
                        "$cond":
                        {
                            "if": { "$isArray": { '$arrayElemAt': ['$likedBy', 0] } },
                            "then": { "$size": { '$arrayElemAt': ['$likedBy', 0] } },
                            "else": 0
                        }
                    }
                }
            },
            {
                $sort: {
                    likes: -1,
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: (questionData.page - 1) * questionData.pageSize },
                        { $limit: questionData.pageSize }
                    ],
                    totalCount: [
                        { $count: "value" }
                    ]
                }
            }
        ]
        advertisementAggregation = [
            { $match: { status: 1 } },
            { $sample: { size: 1 } },
            { $unset: ["createdAt", "updatedAt", "status"] }
        ]
        qaData = await db.getAggregation("question", qaAggregation)
        randomAdvertisment = await db.getAggregation("advertisment", advertisementAggregation)
        if (qaData[0].data.length !== 0) {
            if (qaData[0].data.length > 9 && randomAdvertisment.length !== 0) {
                qaData[0].data.splice(5, 0, randomAdvertisment[0]);
                qaData[0].data.pop()

                return ctx.response.body = { status: 1, data: JSON.stringify(qaData[0].data), totalCount: qaData[0].totalCount[0].value }
            }

            return ctx.response.body = { status: 1, data: JSON.stringify(qaData[0].data), totalCount: qaData[0].totalCount[0].value }
        }

        return ctx.response.body = { status: 1, data: JSON.stringify(qaData[0].data), totalCount: 0 }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in Qa controllers/getAllQa - ${error.message}` }
    }
}

module.exports = {
    askQuestion, deleteQuestion, postAnswer, deleteAnswer, addReply, deleteReply,
    getAnswersAndReplies, updateLike, getAllQa
}