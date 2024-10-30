require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bot = require('./bot');
const app = express()
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        bot.start();
    })
    .catch((error) => console.error('MongoDB connection error:', error));

app.listen(process.env.PORT,()=>{
    console.log('Server is running on port', process.env.PORT)
})