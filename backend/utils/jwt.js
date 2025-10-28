const sendToken = (user, statusCode, res, message = 'Success') => {
    // Creating JWT Token - only contains essential claims
    const token = user.getJwtToken();

    // Setting cookies 
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            message
            // ❌ Remove user data from response
        });
}

module.exports = sendToken;