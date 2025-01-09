import { model, Schema } from "mongoose";
import { ISchool } from "../types/model";

const schoolSchema = new Schema<ISchool>({
  schoolName: { type: String, required: true, unique: true },
  location: { type: String, required: true },
});

export const School = model<ISchool>("School", schoolSchema);
