module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;


    if (process.env.NODE_ENV == 'development') {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack,
            error: err
        })
    }

    if (process.env.NODE_ENV == 'production') {
        let message = err.message;
        let error = new Error(message);


        if (err.name == "ValidationError") {
            message = Object.values(err.errors).map(value => value.message)
            error = new Error(message)
            err.statusCode = 400
        }

        if (err.name == 'CastError') {
            message = `Resource not found: ${err.path}`;
            error = new Error(message)
            err.statusCode = 400
        }

        if (err.code === 11000) {
            let message;

            // Single insert duplicate
            if (err.keyValue) {
                const field = Object.keys(err.keyValue)[0];
                message = `${field} already exists: ${err.keyValue[field]}`;
            }
            // Bulk insert duplicate
            else if (err.writeErrors && err.writeErrors.length > 0) {
                const duplicates = err.writeErrors.map(e => {
                    if (e.err && e.err.op && e.err.op.variants && e.err.op.variants.length > 0) {
                        const sku = e.err.op.variants[0].sku || 'duplicate';
                        return `variants.sku already exists: ${sku}`;
                    }
                    return 'Duplicate key error';
                });
                message = duplicates.join(', ');
            }
            else {
                message = 'Duplicate key error';
            }

            err.statusCode = 400;
            err.message = message;
        }


        if (err.name == 'JSONWebTokenError') {
            let message = `JSON Web Token is invalid. Try again`;
            error = new Error(message)
            err.statusCode = 400
        }

        if (err.name == 'TokenExpiredError') {
            let message = `JSON Web Token is expired. Try again`;
            error = new Error(message)
            err.statusCode = 400
        }

        res.status(err.statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error',
        })


    }
}