const Router = require('koa-router')
const { askQuestion, deleteQuestion, postAnswer, deleteAnswer, addReply, deleteReply, getAnswersAndReplies, updateLike, getAllQa } = require('../../controllers/post/qa')
const qaRouter = new Router({ prefix: "/qa" })

try {
    qaRouter.post("/askQuestion", askQuestion)
    qaRouter.post("/deleteQuestion", deleteQuestion)
    qaRouter.post("/getMyQuestion")
    qaRouter.post("/postAnswer", postAnswer)
    qaRouter.post("/deleteAnswer", deleteAnswer)
    qaRouter.post("/postReply", addReply)
    qaRouter.post("/deleteReply", deleteReply)
    qaRouter.post("/getAnswersAndReplies", getAnswersAndReplies)
    qaRouter.post("/updateQuestionLike", updateLike)
    qaRouter.post("/reportPost")
    qaRouter.get("/getAllQa", getAllQa)

} catch (error) {
    console.log(`Error in Qa router - ${error}`);
}

module.exports = { qaRouter }