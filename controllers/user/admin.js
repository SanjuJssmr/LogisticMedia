const db = require("../../model/mongodb")
const { ObjectId } = require("bson")

const getReportPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }, aggregationQuery = [];
    try {
        let postInfo;
        aggregationQuery = [
            { $match: { reportCount: { $ne: [] }, status: 1 } },
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
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userInfo.fullName" }, "$$ROOT"] } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: "reportCount.userId",
                    foreignField: "_id",
                    as: 'reportUser'
                }
            },
            { $unset: ["reportUser.email", "reportUser.profile", "reportUser.designation", "reportUser.otp", "reportUser.state", "reportUser.country", "reportUser.role", "reportUser.status", "reportUser.password", "reportUser.dob", "reportUser.createdAt", "reportUser.updatedAt"] },
            {
                $addFields: {
                    "reports": {
                        $map: {
                            input: "$reportCount",
                            as: "report",
                            in: {
                                $mergeObjects: [
                                    "$$report",
                                    {
                                        userInfo: {
                                            $arrayElemAt: ["$reportUser", {
                                                $indexOfArray: ["$reportUser._id", "$$report.userId"]
                                            }]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $unset: ["reports.userInfo._id"] },
            {
                $project: {
                    'fullName': { '$arrayElemAt': ['$fullName', 0] },
                    "description": "$description",
                    "createdAt": "$createdAt",
                    "reports": "$reports"
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: postInfo }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/getReportPost - ${error.message}` }
    }
}

const deleteReportedPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, updateInfo;
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Post as deleted" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/deleteReportedPost - ${error.message}` }
    }
}

const verifiyCompanyPages = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let pageData = ctx.request.body, pageExists, updateInfo;
        if (Object.keys(pageData).length === 0 && pageData.data === undefined) {
            ctx.response.body = data

            return
        }
        pageData = pageData.data[0];
        pageExists = await db.findDocumentExist("companyPage", { _id: new ObjectId(pageData.id), status: 3 })
        if (pageExists == false) {

            return ctx.response.body = { status: 0, response: "Invalid Request" }
        }
        updateInfo = await db.findByIdAndUpdate("companyPage", pageData.id, { status: pageData.status })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "updated Sucessfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/verifiyCompanyPages - ${error.message}` }
    }
}

const getAllUnverifiedPages = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }, pageDetails
    try {
        pageDetails = await db.findDocuments("companyPage", { status: 3 }, { updatedAt: 0, otp: 0 })
        if (pageDetails) {

            return ctx.response.body = { status: 1, data: JSON.stringify(pageDetails) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/getAllUnverifiedPages - ${error.message}` }
    }
}

module.exports = { getReportPost, deleteReportedPost, verifiyCompanyPages, getAllUnverifiedPages }