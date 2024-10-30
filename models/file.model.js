const mongoose = require('mongoose');
const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    file_url: {
        type: String,
        required: true,
    },
    uploaded_by: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
},{collection: 'Files'});

const Assignment = mongoose.model('Files', assignmentSchema);
module.exports = Assignment;
