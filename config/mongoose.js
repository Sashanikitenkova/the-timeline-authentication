const mongoose = require('mongoose');

require('dotenv').config();
const db_url = process.env.DB_URL;

mongoose.connect(db_url)
   .then(() => {
    console.log('DB is connected');
   })
   .catch(err => {
    console.log(err);
   })