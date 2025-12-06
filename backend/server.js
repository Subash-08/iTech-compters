const path = require('path');
const connectDatabase = require('./config/database');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'config/config.env') })


const app = require('./app');
// Connect to database first
connectDatabase()
    .then((con) => {

        // Start server only after DB is connected
        const server = app.listen(process.env.PORT, () => {
            console.log(`Server listening on port: ${process.env.PORT} in ${process.env.NODE_ENV}`);
        });

        // Handle MongoDB connection errors after initial connection
        const db = con.connection;

        db.on('error', (error) => {
            console.error('MongoDB connection error after initial connect:', error);
        });

        db.on('disconnected', () => {
            console.log('MongoDB disconnected - attempting to reconnect...');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error(`Unhandled Rejection: ${err.message}`);
            console.error(err.stack);
            server.close(() => {
                console.log('Server closed due to unhandled rejection');
                process.exit(1);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error(`Uncaught Exception: ${err.message}`);
            console.error(err.stack);
            server.close(() => {
                console.log('Server closed due to uncaught exception');
                process.exit(1);
            });
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err);
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        process.exit(1);
    });