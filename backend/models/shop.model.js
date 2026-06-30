import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    openingTime: {
        type: String,
        default: "09:00"
    },
    closingTime: {
        type: String,
        default: "22:00"
    },
    items:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Item"
    }]
}, {timestamps:true})

const Shop = mongoose.model("Shop",shopSchema)
export default Shop;
