const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const connectionSchema = mongoose.Schema({
    sender: {
        type: ObjectId,
        ref :"user",
        required : true
    },
    recipient: {
        type: ObjectId,
        ref :"user",
        required : true
    },
    status: {
        type: Number,
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("connection", connectionSchema)