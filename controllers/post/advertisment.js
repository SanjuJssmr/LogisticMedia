const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const common = require("../../model/common");
const ObjectId = mongoose.Types.ObjectId

const addAdvertisement = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let advertData = ctx.request.body, fileData = ctx.request.files, advertInfo, filePath, fileInfo;
        if (Object.keys(advertData).length === 0 && advertData == undefined) {
            ctx.response.body = data

            return
        }
        advertData.files = []
        if (fileData.length !== 0) {
            for (let file of fileData) {
                filePath = await common.uploadBufferToAzureBlob(file, file.mimetype)
                fileInfo = {
                    filePath: filePath,
                    fileType: file.mimetype
                }
                advertData.files.push(fileInfo)
            }
        }
        advertInfo = await db.insertSingleDocument("advertisment", advertData)
        if (Object.keys(advertInfo).length !== 0) {

            return ctx.response.body = { status: 1, response: "Advertisment added successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in advertisment controllers/addAdvertisment - ${error.message}` }
    }
}

const getAdvertisement = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let advertInfo, aggregationQuery = [];
        aggregationQuery = [
            { $match: { status: 1 } },
            { $sample: { size: 1 } },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    description: 1,
                    files: 1,
                    link: 1
                }
            }
        ]
        advertInfo = await db.getAggregation("advertisment", aggregationQuery)
        if (advertInfo) {

            return ctx.response.body = { status: 1, data: JSON.stringify(advertInfo) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in advertisment controllers/getAdvertisment - ${error.message}` }
    }
}

const getAllAdvertisement = async (ctx) => {
    try {
        let advertInfo
        advertInfo = await db.findDocuments("advertisment", {})

        return ctx.response.body = { status: 1, data: JSON.stringify(advertInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in advertisment controllers/getAllAdvertisment - ${error.message}` }
    }
}

const deleteAdvertisement = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let advertData = ctx.request.body, advertInfo, updateInfo;
        if (Object.keys(advertData).length === 0 && advertData == undefined) {
            ctx.response.body = data

            return
        }
        advertData = advertData.data[0]
        advertInfo = await db.findSingleDocument("advertisment", { _id: advertData.id, status: 1 })
        if (advertInfo == null) {

            return ctx.response.body = { status: 1, response: "No advertisment found" }
        }
        updateInfo = await db.updateOneDocument("advertisment", { _id: advertInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Advertisment deleted successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in advertisment controllers/deleteAdvertisment - ${error.message}` }
    }
}

module.exports = { addAdvertisement, getAdvertisement, deleteAdvertisement, getAllAdvertisement }