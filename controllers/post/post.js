const db = require("../../model/mongodb")

const addPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, likeInfo;
        postData = postData.data[0];
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const deletePost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, updateInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const getMyPost = async (ctx) => {
    try {
        let postData = ctx.request.body, postInfo;
        postData = postData.data[0];
        postInfo = await db.findDocuments("post", { createdBy: postData.userId })

        return ctx.response.body = { status: 1, data: postInfo }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const postComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, postInfo, commentInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}


const deleteComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, commentInfo, updateInfo, userInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}


const addReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo, userInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}


const deleteReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo, replyInfo, userInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const getCommentsAndReplies = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, commentAndReplies, aggregationQuery = [];
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        aggregationQuery = [
            {
                $lookup:
                {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$userData", 0] }, "$$ROOT"] } }
            },
            { $project: { userData: 0 } }
        ]
        commentAndReplies = await db.getAggregation("postComment", aggregationQuery)

        return ctx.response.body = { status: 0, data: commentAndReplies }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}


const updateLike = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, likeInfo;
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
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}



module.exports = { addPost, deletePost, getMyPost, postComment, deleteComment, addReply, deleteReply, getCommentsAndReplies, updateLike }
