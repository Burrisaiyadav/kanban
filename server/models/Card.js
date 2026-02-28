const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    column: { type: String, required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
