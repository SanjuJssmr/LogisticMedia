const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const postSchema = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        ref: "user"
    },
    companyName: {
        type: String,
        required: true
    },
    gst: {
        type: String,
        required: true
    },
    pan: {
        type: String,
        required: true
    },
    licenseNo: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("pageDetails", postSchema) 