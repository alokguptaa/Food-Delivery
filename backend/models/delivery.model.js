import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    order:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Order"
    },
    shop:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Shop"
    },
    shopOrderId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    brodcastedTo:[
        {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"User"
        }
    ],
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },
    status:{
        type:String,
        enum:["broadcasted", "assigned", "completed"],
        default:"broadcasted"
    },
    accepteAt:Date

},{timestamps:true})

const delivery = mongoose.model("delivery", deliverySchema)

export default delivery;
