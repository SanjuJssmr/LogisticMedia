const Router = require('koa-router')
const { addPost, deletePost, getMyPost, postComment, deleteComment, addReply, deleteReply, getCommentsAndReplies, updateLike } = require('../../controllers/post/post')
const postRouter = new Router({ prefix: "/post" })

try {
    postRouter.post("/addPost", addPost)
    postRouter.post("/deletePost", deletePost)
    postRouter.post("/getMyPost", getMyPost)
    postRouter.post("/getSinglePost")
    postRouter.post("/postComment", postComment)
    postRouter.post("/deleteComment", deleteComment)
    postRouter.post("/postReply", addReply)
    postRouter.post("/deleteReply", deleteReply)
    postRouter.post("/getCommentAndReply", getCommentsAndReplies)
    postRouter.post("/updatePostLike", updateLike)
    postRouter.post("/getTrendingPost")
    postRouter.post("/getFriendsPost")
    postRouter.post("/getForYouPost")

} catch (error) {
    console.log(`error in post router - ${error}`);
}

module.exports = { postRouter }