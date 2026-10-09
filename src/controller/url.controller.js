const urlModel = require("../model/url.model.js");
const url = require("../services/url.services.js");

const shortenurl = async (req,res) =>{
    const body = req.body;

    if(!body.url){
        res.status(400).json({
            "message" : "no proper url",
        })
    }


}