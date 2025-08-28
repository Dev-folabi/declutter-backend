import { Schema, model } from 'mongoose';
import { OTPVerificationModelType } from '../types/model';

const OTPVerify = new Schema<OTPVerificationModelType>(
  {
    owner : {
      id: { type: Schema.Types.ObjectId, required: true, refPath: 'owner.type'},
      type: { type: String, enum: ["User", "Admin"], required: true}
    }, 
    OTP: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['password', 'transaction pin', 'activate account'],
      default: 'password',
    },
    verificationType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

OTPVerify.index({ updatedAt: 1 }, { expireAfterSeconds: 1800 });

OTPVerify.index({ 'owner.id': 1, type: 1 }, { unique: true });

const OTPVerification = model('OTPVerification', OTPVerify);

export default OTPVerification;
