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
        default: "https://t4.ftcdn.net/jpg/03/59/58/91/360_F_359589186_JDLl8dIWoBNf1iqEkHxhUeeOulx0wOC5.jpg"
    },
    email :{
        type :String,
        required:true,
        lowercase :true
    }
    licenseNo: {
        type: String,
        required: true
    },
    about :{
        type : String
    },
    status: {
        type: Number,
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("companyPage", companyPageSchema) 