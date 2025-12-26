const sendToken = (user, statusCode, res, message = 'Success') => {
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Add this
        sameSite: 'strict' // Add this for CSRF protection
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            message
        });
}

module.exports = sendToken;