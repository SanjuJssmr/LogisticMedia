const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const common = require("../../model/common");
const ObjectId = mongoose.Types.ObjectId

const addPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, fileData = ctx.request.files, postInfo, likeInfo, filePath;
        postData.hashtags = JSON.parse(postData.hashTags)
        if (Object.keys(postData).length === 0 && postData == undefined) {
            ctx.response.body = data

            return
        }
        postData.files = []
        if (fileData.length !== 0) {
            for (let file of fileData) {
                filePath = await common.uploadBufferToAzureBlob(file)
                postData.files.push(filePath)
            }
        }
        postInfo = await db.insertSingleDocument("post", postData)
        if (Object.keys(postInfo).length !== 0) {
            likeInfo = await db.insertSingleDocument("postLike", { postId: postInfo._id })
            if (Object.keys(likeInfo).length !== 0) {

                return ctx.response.body = { status: 1, response: "Post added successfully" }
            }
            return ctx.response.body = data
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/addPost - ${error.message}` }
    }
}

const deletePost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, updateInfo;
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, createdBy: postData.userId })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }

        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Post deleted successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/deletePost - ${error.message}` }
    }
}

const getMyPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, aggregationQuery = [];
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        aggregationQuery = [
            {
                $match: { status: 1, createdBy: new ObjectId(postData.userId) },
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
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile"
                }
            },
            {
                $project: {
                    "createdBy": 1,
                    "description": 1,
                    "hashtags": 1,
                    "country": 1,
                    "files": 1,
                    "createdAt": 1,
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    'likedBy': { '$arrayElemAt': ['$likedBy', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" }
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getMyPost - ${error.message}` }
    }
}

const getMyPagePost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, aggregationQuery = [];
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        aggregationQuery = [
            {
                $match: { status: 1, createdBy: new ObjectId(postData.userId), companyId: new ObjectId(postData.companyId) },
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
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    companyName: "$companyInfo.companyName",
                    companyProfile: "$companyInfo.profile"
                }
            },
            {
                $project: {
                    "createdBy": 1,
                    "description": 1,
                    "hashtags": 1,
                    "country": 1,
                    "files": 1,
                    "createdAt": 1,
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    'likedBy': { '$arrayElemAt': ['$likedBy', 0] },
                    "companyName": { '$arrayElemAt': ['$companyName', 0] },
                    'companyProfile': { '$arrayElemAt': ['$companyProfile', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" }
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getPagePost - ${error.message}` }
    }
}

const getTrendingPost = async (ctx) => {
    try {
        let postInfo, aggregationQuery = [];
        aggregationQuery = [
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
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    companyName: "$companyInfo.companyName",
                    companyProfile: "$companyInfo.profile",
                    reporterIds: "$reportCount.userId"
                }
            },
            {
                $project: {
                    "createdBy": "$createdBy",
                    "description": "$description",
                    "hashtags": "$hashtags",
                    "files": "$files",
                    "createdAt": "$createdAt",
                    "reporterIds": "$reporterIds",
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    "likedBy": { '$arrayElemAt': ['$likedBy', 0] },
                    "companyName": { '$arrayElemAt': ['$companyName', 0] },
                    'companyProfile': { '$arrayElemAt': ['$companyProfile', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" },
                }
            },
            {
                $sort: {
                    likes: -1,
                }
            },

        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getTrendingPost - ${error.message}` }
    }
}

const postComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, postInfo, commentInfo;
        if (Object.keys(commentData).length === 0 && commentData.data === undefined) {
            ctx.response.body = data

            return
        }
        commentData = commentData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: commentData.postId })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        commentInfo = await db.insertSingleDocument("postComment", commentData)
        if (Object.keys(commentInfo).length !== 0) {

            return ctx.response.body = { status: 1, response: "Comment added successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/postComment - ${error.message}` }
    }
}

const deleteComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, commentInfo, updateInfo;
        if (Object.keys(commentData).length === 0 && commentData.data === undefined) {
            ctx.response.body = data

            return
        }
        commentData = commentData.data[0];
        commentInfo = await db.findSingleDocument("postComment", { _id: commentData.commentId, userId: commentData.userId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        updateInfo = await db.updateOneDocument("postComment", { _id: commentInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Comment deleted successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/deleteComment - ${error.message}` }
    }
}

const addReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo, userInfo;
        if (Object.keys(replyData).length === 0 && replyData.data === undefined) {
            ctx.response.body = data

            return
        }
        replyData = replyData.data[0];
        commentInfo = await db.findSingleDocument("postComment", { _id: replyData.commentId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        updateInfo = await db.updateOneDocument("postComment", { _id: commentInfo._id }, { $push: { replies: { userReplied: replyData.userId, message: replyData.message } } })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply added successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/addReply - ${error.message}` }
    }
}

const deleteReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo, replyInfo, userInfo;
        if (Object.keys(replyData).length === 0 && replyData.data === undefined) {
            ctx.response.body = data

            return
        }
        replyData = replyData.data[0];
        commentInfo = await db.findSingleDocument("postComment", { _id: replyData.commentId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        replyInfo = await db.findSingleDocument("postComment", { _id: replyData.commentId, replies: { $elemMatch: { _id: replyData.replyId, userReplied: replyData.userId, status: 1 } } })
        if (replyInfo == null) {

            return ctx.response.body = { status: 1, response: "No reply found" }
        }
        updateInfo = await db.updateOneDocument("postComment", { _id: commentInfo._id, "replies._id": replyData.replyId }, { "replies.$.status": 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply deleted successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/deleteReply - ${error.message}` }
    }
}

const getCommentsAndReplies = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, commentAndReplies, aggregationQuery = [];
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        aggregationQuery = [
            { $match: { $and: [{ postId: new ObjectId(postData.postId) }, { status: 1 }] } },
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
            { $unset: ["replyUser.email", "replyUser.otp", "replyUser.state", "replyUser.country", "replyUser.role", "replyUser.status", "replyUser.password", "replyUser.dob", "replyUser.createdAt", "replyUser.updatedAt"] },
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
                    "message": "$message",
                    "commentedOn": "$commentedOn",
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
        commentAndReplies = await db.getAggregation("postComment", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(commentAndReplies) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getCommentsAndReplies - ${error.message}` }
    }
}

const updateLike = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, likeInfo;
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("postLike", { postId: postData.postId })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No posta found" }
        }
        if (postData.status === 1) {
            updateInfo = await db.updateOneDocument("postLike", { _id: postInfo._id }, { $push: { likedBy: postData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Like added successfully" }
            }
        }
        if (postData.status === 2) {
            updateInfo = await db.updateOneDocument("postLike", { _id: postInfo._id }, { $pull: { likedBy: postData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Disliked successfully" }
            }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/updateLike - ${error.message}` }
    }
}

const getForYouPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, aggregationQuery = [];
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0]
        aggregationQuery = [
            {
                $match: {
                    status: 1,
                    $or: [
                        { state: postData.state },
                        { country: postData.country }
                    ]
                },
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
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    companyName: "$companyInfo.companyName",
                    companyProfile: "$companyInfo.profile",
                    reporterIds: "$reportCount.userId"
                }
            },
            {
                $project: {
                    "createdBy": "$createdBy",
                    "description": "$description",
                    "hashtags": "$hashtags",
                    "files": "$files",
                    "createdAt": "$createdAt",
                    "reporterIds": "$reporterIds",
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    "likedBy": { '$arrayElemAt': ['$likedBy', 0] },
                    "companyName": { '$arrayElemAt': ['$companyName', 0] },
                    'companyProfile': { '$arrayElemAt': ['$companyProfile', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" },
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getForYouPost - ${error.message}` }
    }
}

const reportPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo;
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        if (postInfo.reportCount.length > 3) {
            updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status: 0, $push: { reportCount: { userId: postData.userId, reason: postData.reason } } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Post as been reported" }
            }
        }
        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { $push: { reportCount: { userId: postData.userId, reason: postData.reason } } })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Post as been reported" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/reportPost - ${error.message}` }
    }
}

const getPostById = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, aggregationQuery = [];
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0]
        aggregationQuery = [
            { $match: { $and: [{ _id: new ObjectId(postData.postId) }, { status: 1 }] } },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likes: { $size: "$postInfo" }
                }
            },
            {
                $project: {
                    "postInfo": 0,
                    "status": 0,
                    "reportCount": 0,
                    "updatedAt": 0
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getPostById - ${error.message}` }
    }
}

const getFriendsPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let connectionData = ctx.request.body, postInfo, aggregationQuery = [];
        if (Object.keys(connectionData).length === 0 && connectionData.data === undefined) {
            ctx.response.body = data

            return
        }
        connectionData = connectionData.data[0]
        aggregationQuery = [
            {
                $match: {
                    $or: [
                        { status: 1 },
                        { status: 2 }
                    ]
                }
            },
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(connectionData.userId) },
                        { recipientId: new ObjectId(connectionData.userId) }
                    ]
                }
            },
            {
                $group:
                {
                    _id: null,
                    sData: { $addToSet: "$senderId" },
                    rData: { $addToSet: "$recipientId" }
                }
            },
            {
                $addFields: {
                    mergedData: {
                        $setUnion: ["$sData", "$rData"]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    connectionIds: {
                        $setDifference: ["$mergedData", [new ObjectId(connectionData.userId)]]
                    },
                }
            },
            {
                $group:
                {
                    _id: null,
                    myConnections: { $addToSet: "$connectionIds" },
                }
            },
            {
                $unwind: "$myConnections"
            },
            {
                $lookup:
                {
                    from: "posts",
                    localField: "myConnections",
                    foreignField: "createdBy",
                    as: "postInfo",
                }
            },
            {
                $unwind: "$postInfo"
            },
            { $match: { "postInfo.status": 1 } },
            {
                $lookup:
                {
                    from: "users",
                    localField: "postInfo.createdBy",
                    foreignField: "_id",
                    as: "userInfo",
                }
            },
            {
                $lookup:
                {
                    from: "companypages",
                    localField: "postInfo.companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "postInfo._id",
                    foreignField: "postId",
                    as: "postLikes",
                }
            },
            {
                $addFields: {
                    likedBy: "$postLikes.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    companyName: "$companyInfo.companyName",
                    companyProfile: "$companyInfo.profile",
                    reporterIds: "$reportCount.userId"
                }
            },
            {
                $project: {
                    _id: 0,
                    "_id": "$postInfo._id",
                    "createdBy": "$postInfo.createdBy",
                    "createdAt": "$postInfo.createdAt",
                    "description": "$postInfo.description",
                    "hashtags": "$postInfo.hashtags",
                    "state": "$postInfo.state",
                    "country": "$postInfo.country",
                    "files": "$postInfo.files",
                    "reporterIds": "$reporterIds",
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    'likedBy': { '$arrayElemAt': ['$likedBy', 0] },
                    "companyName": { '$arrayElemAt': ['$companyName', 0] },
                    'companyProfile': { '$arrayElemAt': ['$companyProfile', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" }
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },
        ]
        postInfo = await db.getAggregation("connection", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getFriendsPost - ${error.message}` }
    }
}

const getAllNews = async (ctx) => {
    try {
        let postInfo, aggregationQuery = [];
        aggregationQuery = [
            {
                $match: {
                    status: 1,
                    hashtags: { $in: ["news"] }
                },
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
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    reporterIds: "$reportCount.userId"
                }
            },
            {
                $project: {
                    "createdBy": "$createdBy",
                    "description": "$description",
                    "hashtags": "$hashtags",
                    "files": "$files",
                    "createdAt": "$createdAt",
                    "reporterIds": "$reporterIds",
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    "likedBy": { '$arrayElemAt': ['$likedBy', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" },
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getAllNews - ${error.message}` }
    }
}

const getPagePost = async (ctx) => {
    try {
        let postInfo, aggregationQuery = [];
        aggregationQuery = [
            {
                $match: { $and: [{ companyId: { $exists: true } }, { status: 1 }] },
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
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "postInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$postInfo.likedBy",
                    fullName: "$userInfo.fullName",
                    designation: "$userInfo.designation",
                    profile: "$userInfo.profile",
                    companyName: "$companyInfo.companyName",
                    companyProfile: "$companyInfo.profile",
                    reporterIds: "$reportCount.userId"
                }
            },
            {
                $project: {
                    "createdBy": "$createdBy",
                    "description": "$description",
                    "hashtags": "$hashtags",
                    "files": "$files",
                    "createdAt": "$createdAt",
                    "reporterIds": "$reporterIds",
                    "fullName": { '$arrayElemAt': ['$fullName', 0] },
                    "designation": { '$arrayElemAt': ['$designation', 0] },
                    "profile": { '$arrayElemAt': ['$profile', 0] },
                    "likedBy": { '$arrayElemAt': ['$likedBy', 0] },
                    "companyName": { '$arrayElemAt': ['$companyName', 0] },
                    'companyProfile': { '$arrayElemAt': ['$companyProfile', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" },
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },

        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers/getTrendingPost - ${error.message}` }
    }
}

module.exports = {
    addPost, deletePost, getMyPost, postComment, deleteComment, addReply,
    deleteReply, getCommentsAndReplies, updateLike, getTrendingPost, getForYouPost, reportPost,
    getPostById, getFriendsPost, getMyPagePost, getAllNews, getPagePost
}
