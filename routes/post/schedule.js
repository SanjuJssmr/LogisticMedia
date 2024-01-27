const Router = require('koa-router')
const { addSchedule, deleteSchedule, getMySchedule, getScheduleById, postComment, getCommentsAndReplies, deleteComment, addReply, deleteReply, updateLike, getAllSchedule } = require('../../controllers/post/schedule')
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
    scheduleRouter.post("/getAllSchedule", getAllSchedule)

} catch (error) {
    console.log(`Error in schedule router - ${error}`);
}

module.exports = { scheduleRouter }