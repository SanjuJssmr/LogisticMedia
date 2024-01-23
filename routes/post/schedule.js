const Router = require('koa-router')
const { addSchedule, deleteSchedule, getMySchedule, getScheduleById, postComment, getCommentsAndReplies, deleteComment, addReply, deleteReply, updateLike } = require('../../controllers/post/schedule')
const scheduleRouter = new Router({ prefix: "/schedule" })

try {
    scheduleRouter.post("/addSchedule", addSchedule)
    scheduleRouter.post("/deleteSchedule", deleteSchedule)
    scheduleRouter.post("/getMySchedule", getMySchedule)
    scheduleRouter.post("/getScheduleById", getScheduleById)
    scheduleRouter.post("/postComment", postComment)
    scheduleRouter.post("/deleteComment", deleteComment)
    scheduleRouter.post("/postReply", addReply)
    scheduleRouter.post("/deleteReply", deleteReply)
    scheduleRouter.post("/getCommentAndReply", getCommentsAndReplies)
    scheduleRouter.post("/updateScheduleLike", updateLike)

} catch (error) {
    console.log(`error in schedule router - ${error}`);
}

module.exports = { scheduleRouter }