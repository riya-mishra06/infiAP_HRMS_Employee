const mongoose = require('mongoose');

const db_url = process.env.MONGODB_URI;

const connectDB = async () => {
    if (!db_url) {
        throw new Error('MONGODB_URI is required. Add it to infiApBackend/.env before starting the server.');
    }

    try {
        await mongoose.connect(db_url);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

module.exports = connectDB;
