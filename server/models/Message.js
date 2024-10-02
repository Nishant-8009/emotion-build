// models/Message.js

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
