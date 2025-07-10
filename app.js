const express = require('express');
const routes = require('./config/routes');
const cookieParser = require('cookie-parser');

require('./config/mongoose');

const app = express();

require('dotenv').config();
const port = process.env.PORT;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.listen(port, () => console.log('Server is on 3000'));
