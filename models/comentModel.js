const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
      body: {
        type: String,
        required: true,
        trim: true
      },
      post: {
        type: Schema.Types.ObjectId,
        ref: "post",
        required: true
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    },
  {timestamps: true}
  )

  module.exports = mongoose.model('comment', commentSchema);