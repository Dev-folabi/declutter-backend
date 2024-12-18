import { model, Schema } from 'mongoose';

const waitlistSchema = new Schema({
  email: { type: String, required: true, unique: true },
});

export const Waitlist = model('Waitlist', waitlistSchema);

