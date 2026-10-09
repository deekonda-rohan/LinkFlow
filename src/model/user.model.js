const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select:false,
        },
    },
    {
        timestamps: true,
    }
);

userModel.pre("save",async function(){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10);
    }
})

userModel.methods.comparePasswords(async function(password){
    return await bcrypt.compare(password,this.password);
})

const userModel = mongoose.model("User", userSchema);       

module.exports = userModel;