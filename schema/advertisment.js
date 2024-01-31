const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const advertismentSchema = mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    files: {
        type: Array,
        default: []
    },
    link: {
        type: String
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("advertisment", advertismentSchema)