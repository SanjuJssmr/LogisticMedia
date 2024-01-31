const Router = require('koa-router');
const { addAdvertisment, getAdvertisment, deleteAdvertisment, getAllAdvertisment } = require('../../controllers/post/advertisment');
const advertismentRouter = new Router({ prefix: "/advertisment" })

try {
    advertismentRouter.post("/addAdvertisment", addAdvertisment)
    advertismentRouter.get("/getAdvertisment", getAdvertisment)
    advertismentRouter.post("/deleteAdvertisment", deleteAdvertisment)
    advertismentRouter.get("/getAllAdvertisment", getAllAdvertisment)

} catch (error) {
    console.log(`Error in Advertisment router - ${error}`);
}

module.exports = { advertismentRouter }