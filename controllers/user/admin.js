const db = require("../../model/mongodb")

const getReportPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postInfo;
        postInfo = await db.findDocuments("post", { reportCount: { $ne: [] }, status: 1 }, { "_id": 1, "description": 1, "reportCount": 1, "createdAt": 1 })

        return ctx.response.body = { status: 1, data: postInfo }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers - ${error.message}` }
    }
}

const deleteReportedPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, updateInfo;
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body  { status: 0, response: "No post found" }
        }
        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status : 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Post as deleted" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers - ${error.message}` }
    }
}

module.exports = { getReportPost, deleteReportedPost }