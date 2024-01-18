const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const scheduleSchema = mongoose.Schema({
    createBy: {
        type: ObjectId,
        ref :"page",
        required:true
    },
    pageId: {
        type: ObjectId,
        ref :"page",
        required:true
    },
    pol: {
        type: String
    },
    pod: {
        type: String
    },
    openingOn: {
        type: Date
    },
    bookingCutOff: {
        type: Date
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("schedule", scheduleSchema)