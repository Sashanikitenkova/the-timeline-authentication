const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
      post : {
        type: String,
        required: true,
        minlength :[25, "Post should be minimum 25 character "],
        trim: true
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      comments: [
        {
          type: Schema.Types.ObjectId,
          ref: "comment"
        }
      ]
    },
  {timestamps: true}
  )

  module.exports = mongoose.model('post', postSchema);