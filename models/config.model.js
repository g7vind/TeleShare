const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    is_bot_active: {
        type: Boolean,
        required: true,
    },
},{collection: 'Config'});

const Config = mongoose.model('Config', configSchema);
module.exports = Config;