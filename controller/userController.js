const userModule = require('../models/userModule');
const postModel = require('../models/postModel');
const commentModel = require('../models/comentModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const renderSignupPage = (req, res) => {
    res.render('signupLogin', { title: 'Sign Up | Login', result: '', err: '' });
}

const signup = async (req, res) => {
    let user = await userModule.findOne(({ email: req.body.email }));

    if(user) {
        res.render('signupLogin', { 
            title: 'Sign Up | Login',
            result: '',
            err: 'User is already exist please login!' });
    } else {

        if(req.body.password !== req.body.confirmPassword) {
            return  res.render('signupLogin', { 
                        title: 'Sign Up | Login',
                        result: '',
                        err: 'Passwords do not match!' });
        }

        // bcrypt/hash the password
        let hashPass = bcrypt.hashSync(req.body.password, 10);

        let userData = {
            ...req.body,
            password: hashPass
        };

        const newUser = new userModule(userData);

        newUser.save()
           .then(data => {
               res.render('signupLogin', { title: 'Sign Up | Login', result: 'User is signup... you can log in now...', err: '' })
           })
           .catch(err => {
               res.status(500).render('error', {
                   title: 'Error',
                   message: 'Server error'
               });
           })
    }
}

const login = async (req, res) => {

    let existUser = await userModule.findOne({ email: req.body.email});

    if(!existUser) {
        res.render('signupLogin', { 
            title: 'Sign Up | Login', 
            result: '', 
            err: 'User is not exist please Signup fist...' });
    } else {
        
        let isCorrectPass = bcrypt.compareSync(req.body.password, existUser.password);

        if(!isCorrectPass) {
            res.render('signupLogin', { 
            title: 'Sign Up | Login', 
            result: '', 
            err: 'Password is not correct...' });
        } else {

            let tokenData = {
                userId: existUser._id,
                userName: existUser.firstName,
            }

            let userToken = await jwt.sign(tokenData, 'User is JWT now');

            res.cookie('userToken', userToken);
            res.redirect('/user-dashboard');
        }
    }
}

const logout = (req, res) => {
    res.clearCookie('userToken');
    res.redirect('/')
}

module.exports = {
    signup,
    renderSignupPage,
    login,
    logout
}