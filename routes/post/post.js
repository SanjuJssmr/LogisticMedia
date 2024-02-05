const Router = require('koa-router')
const { addPost, deletePost, getMyPost, postComment, deleteComment, addReply, deleteReply, getCommentsAndReplies, updateLike, 
    getTrendingPost, getForYouPost, reportPost, getPostById, 
    getFriendsPost,
    getPagePost,
    getAllNews,
    getMyPagePost} = require('../../controllers/post/post')
const postRouter = new Router({ prefix: "/post" })

try {
    postRouter.post("/addPost", addPost)
    postRouter.post("/deletePost", deletePost)
    postRouter.post("/getMyPost", getMyPost)
    postRouter.post("/getPostById", getPostById)
    postRouter.post("/postComment", postComment)
    postRouter.post("/deleteComment", deleteComment)
    postRouter.post("/postReply", addReply)
    postRouter.post("/deleteReply", deleteReply)
    postRouter.post("/getCommentAndReply", getCommentsAndReplies)
    postRouter.post("/updatePostLike", updateLike)
    postRouter.post("/getTrendingPost",getTrendingPost)
    postRouter.post("/getFriendsPost", getFriendsPost)
    postRouter.post("/getForYouPost", getForYouPost)
    postRouter.post("/reportPost", reportPost)
    postRouter.post("/getMyPagePost", getMyPagePost)
    postRouter.get("/getAllNews", getAllNews)
    postRouter.get("/getPagePost", getPagePost)

} catch (error) {
    console.log(`Error in post router - ${error}`);
}

module.exports = { postRouter }