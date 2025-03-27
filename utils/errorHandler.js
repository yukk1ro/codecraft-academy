const handleError = (res, error) => {
    console.error('Error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
            message: 'Validation Error',
            errors: messages
        });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate field value entered',
            field: Object.keys(error.keyPattern)[0]
        });
    }

    // JWT error
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired'
        });
    }

    // Default error
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

module.exports = {
    handleError
}; 