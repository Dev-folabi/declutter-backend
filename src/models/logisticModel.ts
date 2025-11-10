import { Schema, model } from "mongoose";
import { ILogistics} from "../types/model";
import { Order } from "./order";

const LogisticsSchema = new Schema<ILogistics>(
    {
        logisticId: {type: Schema.Types.ObjectId},
        order: {type: Schema.Types.ObjectId, ref: Order, required: true},
        status: {
            type: String, 
            enum: ["ready_for_pickup", "in_transit", "delivered", "cancelled"],
            default: "ready_for_pickup",
        }
    }, { timestamps: true }
);
export const Logistics = model<ILogistics>("Logistics", LogisticsSchema)