const Router = require('koa-router');
const { addAdvertisement, getAdvertisement, deleteAdvertisement, getAllAdvertisement } = require('../../controllers/post/advertisment');
const advertisementRouter = new Router({ prefix: "/advertisement" })

try {
    advertisementRouter.post("/addAdvertisement", addAdvertisement)
    advertisementRouter.get("/getAdvertisement", getAdvertisement)
    advertisementRouter.post("/deleteAdvertisement", deleteAdvertisement)
    advertisementRouter.get("/getAllAdvertisement", getAllAdvertisement)

} catch (error) {
    console.log(`Error in Advertisement router - ${error}`);
}

module.exports = { advertisementRouter }