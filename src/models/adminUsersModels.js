const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminUserSchema = new mongoose.Schema({
    username: {type: String},
    password: {type: String},
    accessType: Number,
    name: {type: String}
}, {autoCreate: false});

const userBasicInfoSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    dob: Date,
    userName: String,
    password: String,
    country: String,
    state: String,
    address: String,
    city: String,
    zipCode: String,
    phone: String,
    phoneCode: String,
    business: String,
    gender: String,
    minor: String,
    accssType: mongoose.Schema.Types.Number,
    approved: String,
    createdOn: Date
}, {autoCreate: true});
userBasicInfoSchema.pre('save', async function(next) {
    var self = this;
    if (self.no_email_check) next();
    else {
        const result = await UserBasicInfo.find({userName : self.userName});
        if (result.length === 0) {
            const salt = await bcrypt.genSalt(10);
            self.password = await bcrypt.hash(self.password, salt);
            self.createdOn = new Date();
            next();
        }
        else next(new Error("Email already exists!"))
    }
});

const changePassword = new mongoose.Schema({email: String}, {autoCreate: true});
const UserBasicInfo = mongoose.model("UserBasicInfo", userBasicInfoSchema);
module.exports = {
    "Users": mongoose.model("users", adminUserSchema),
    UserBasicInfo,
    PasswordChangeList: mongoose.model("passwordChangeList", changePassword)
}