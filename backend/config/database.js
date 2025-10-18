const mongoose = require('mongoose');

// Suppress strictQuery deprecation warning
mongoose.set('strictQuery', true);

const connectDatabase = () => {
    return mongoose.connect(process.env.DB_LOCAL_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
};

module.exports = connectDatabase;
