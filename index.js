// index.js
require('dotenv').config();
const Users = require('./models/user.model');
const Files = require('./models/file.model');
const mongoose = require('mongoose');

const bot = require('./bot');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        bot.start();
    })
    .catch((error) => console.error('MongoDB connection error:', error));
