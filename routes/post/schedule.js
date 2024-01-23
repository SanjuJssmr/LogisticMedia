const Router = require('koa-router')
const { addSchedule, deleteSchedule, getMySchedule, getScheduleById, postComment, getCommentsAndReplies } = require('../../controllers/post/schedule')
const scheduleRouter = new Router({ prefix: "/schedule" })

try {
    scheduleRouter.post("/addSchedule", addSchedule)
    scheduleRouter.post("/deleteSchedule", deleteSchedule)
    scheduleRouter.post("/getMySchedule", getMySchedule)
    scheduleRouter.post("/getScheduleById", getScheduleById)
    scheduleRouter.post("/postComment", postComment)
    scheduleRouter.post("/deleteComment")
    scheduleRouter.post("/postReply")
    scheduleRouter.post("/deleteReply")
    scheduleRouter.post("/getCommentAndReply", getCommentsAndReplies)
    scheduleRouter.post("/updateScheduleLike")
    scheduleRouter.post("/reportSchedule")

} catch (error) {
    console.log(`error in schedule router - ${error}`);
}

module.exports = { scheduleRouter }