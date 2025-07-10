const express = require("express");
const route = express.Router();
const postInform = require('../controller/postController');
const userController = require('../controller/userController');
const auth = require('../middelware/auth');

// Post routes
route.get('/', auth.checkIfUserLoggedIn, postInform.post);
route.post('/add-new-post', auth.checkIfUserNotLogin, postInform.addNewPost);
route.get('/post/:id', postInform.showPost);
route.get('/delete/post/:id', postInform.deletePost);
route.get('/update/post/:id', postInform.editPostPage);
route.post('/edit-post-form/:id', postInform.editPostForm);

// Comments routes
route.post('/post/add/new-comment/:id', auth.checkIfUserNotLogin, postInform.addComment);
route.get('/delete/post/comment/:commentId/:id', auth.checkIfUserNotLogin, postInform.delComment);

// User routes
route.get('/user/signup-login', auth.checkIfUserLoggedIn, userController.renderSignupPage);
route.post('/user/signup-login', userController.signup);
route.post('/user/login', userController.login);
route.get('/user-dashboard', auth.checkIfUserNotLogin, postInform.dashboard);
route.get('/logout', userController.logout);


route.get('/{*any}', postInform.notFoundPage);

module.exports = route;