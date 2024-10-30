const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        unique: true,
    },
    first_name: {
        type: String,
        default:''
    },
    last_name: {
        type: String,
        default: '',
    },
    username: {
        type: String,
        default: '',
    },
    block: {
        type: Number,
        default: 0,
    }
},{collection: 'Users'});

const User = mongoose.model('Users', userSchema);

module.exports = User;
