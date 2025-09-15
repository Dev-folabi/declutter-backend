import mongoose,{Schema, model} from "mongoose";
import { ICategory } from "../types/model";

const category = new Schema({
    name: {type: String, required: true, unique: true, trim: true},
    description: {type: String}
}, {timestamps: true } )

export const Category =  mongoose.model<ICategory>("Category", category);