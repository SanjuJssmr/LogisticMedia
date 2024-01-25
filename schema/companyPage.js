const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const companyPageSchema = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default: "https://i.pinimg.com/originals/ec/d9/c2/ecd9c2e8ed0dbbc96ac472a965e4afda.jpg"
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    licenseNo: {
        type: String,
        required: true
    },
    about: {
        type: String
    },
    status: {
        type: Number,     // 2- otp , 3- verifation BY admin 1- verified 4- rejected By admin
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("companyPage", companyPageSchema) 