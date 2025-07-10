const jwt = require('jsonwebtoken');

const checkIfUserLoggedIn = (req, res, next) => {
    if (req.cookies.userToken) {
        res.redirect('/user-dashboard');
    } else {
        next();
    }
}

const checkIfUserNotLogin = (req, res, next) => {
    if (!req.cookies.userToken) {
        res.redirect('/');
    } else {
        jwt.verify(req.cookies.userToken, 'User is JWT now', function(err, decodeUser) {
            if(err) {
                console.log('issue with verifing the token', err);
                res.redirect('/');
            } else {
                res.locals.username = decodeUser.userName;
                res.locals.userId = decodeUser.userId;
                next();
            }
        });
    }
}

module.exports = {
    checkIfUserLoggedIn,
    checkIfUserNotLogin,
}