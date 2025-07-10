const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
      firstName: {
        type: String,
        required: true,
        trim: true
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
      email : {
        type: String,
        required: true,
        trim: true
      },
      password: {
        type: String,
        required: true,
      },
      posts: [
        {
          type: Schema.Types.ObjectId,
          ref: "post"
        }
      ],
      comments: [
        {
          type: Schema.Types.ObjectId,
          ref: "comment"
        }
      ]
    },
  {timestamps: true}
  )

  module.exports = mongoose.model('user', userSchema);