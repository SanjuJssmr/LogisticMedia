const db = require("../../model/mongodb")

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
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userInfo.fullName"}, "$$ROOT"] } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: "reportCount.userId",
                    foreignField: "_id",
                    as: 'reportUser'
                }
            },
            { $unset: ["reportUser.email","reportUser.profile", "reportUser.designation", "reportUser.otp", "reportUser.state", "reportUser.country", "reportUser.role", "reportUser.status", "reportUser.password", "reportUser.dob", "reportUser.createdAt", "reportUser.updatedAt"] },
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
                    "createdAt":"$createdAt",
                    "reports": "$reports"
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

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

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status: 0 })
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