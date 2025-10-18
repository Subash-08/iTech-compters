const path = require('path');
const app = require('./app');
const connectDatabase = require('./config/database');

// Connect to database first
connectDatabase()
    .then((con) => {

        // Start server only after DB is connected
        const server = app.listen(process.env.PORT, () => {
            console.log(`Server listening on port: ${process.env.PORT} in ${process.env.NODE_ENV}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error(`Unhandled Rejection: ${err.message}`);
            server.close(() => process.exit(1));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error(`Uncaught Exception: ${err.message}`);
            server.close(() => process.exit(1));
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });
