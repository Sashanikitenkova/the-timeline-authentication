const postModel = require('../models/postModel');
const commentModel = require('../models/comentModel');
const userModule = require('../models/userModule');

const post = (req, res) => {
  postModel.find()
    .sort({ createdAt: -1 })
    .populate('author', 'firstName _id')
    .then(result => {
      res.render('home', { title: 'Posts', posts: result, errorMessage: null });
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Could not load posts. Please try again later.'
      });
    })
}

const dashboard = (req, res) => {
  postModel.find()
    .sort({ createdAt: -1 })
    .populate([
    {
      path: 'author',         
      select: 'firstName _id'
    },
    {
      path: 'comments',       
      populate: {
        path: 'author',       
        select: 'firstName _id'
      }
    }
  ])
    .then(result => {
      res.render('dashboard', { 
        title: 'Posts', 
        posts: result, 
        errorMessage: null,
        userId: res.locals.userId, 
        username: res.locals.username,
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Could not load posts. Please try again later.'
      });
    });
}

const addNewPost = async (req, res) => {
  const postText = req.body.post;
  const userId = res.locals.userId;

  if (!postText || postText.length < 25) {
    const posts = await postModel.find().sort({ createdAt: -1 });
    return res.render('dashboard', {
      title: 'Posts',
      posts: posts,
      errorMessage: 'Post must be at least 25 characters long.',
      username: res.locals.username,
      userId: res.locals.userId,
    });
  }

  const newPost = new postModel({ post: postText, author: userId });

  newPost.save()
    .then(savePost => {
      return userModule.findById(userId)
        .then(userInfo => {
          if(!userInfo) {
            return res.status(404).send('User not found');
          }

          userInfo.posts.push(savePost._id);
          return userInfo.save();
        });
    })
    .then(() => {
      res.redirect('/user-dashboard');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error');
    });
};

const showPost = (req, res) => {
  const postId = req.params.id;

  postModel.findById(postId)
     .then(result => {
       res.render('post', { title: 'Post', post: result, errorMessage: null });
     })
     .catch(err => {
      console.log(arr);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Could not load post. Please try again later.'
      });
     })
}

const deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    // Find the post
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Post not found.'
      });
    }

    const userId = post.author;
    const commentIds = post.comments;

    // Delete the post
    await postModel.findByIdAndDelete(postId);

    // Delete the post from the arr user.posts
    await userModule.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    // Delete all comments related to this post
    await commentModel.deleteMany({ _id: { $in: commentIds } });

    // Delete these comments from each user.comments
    await userModule.updateMany(
      { comments: { $in: commentIds } },
      { $pull: { comments: { $in: commentIds } } }
    );

    res.redirect('/user-dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Could not delete post. Please try again later.'
    });
  }
}

const editPostPage = (req, res) => {
  const postId = req.params.id;

  postModel.findById(postId)
    .then(result => {
      res.render('edit-post', { title: 'Edit Post', post: result, errorMessage: null })
     })
    .catch(err => {
      console.log(err);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Could not load post for editing.'
      });
    })
}

const editPostForm = async(req, res) => {
  const postId = req.params.id;
  const postText = req.body.post;

  if (!postText || postText.length < 25) {
     try {
      const post = await postModel.findById(postId);

      return res.render('edit-post', {
        title: 'Edit Post',
        post: post,
        errorMessage: 'Post must be at least 25 characters long.'
      });
    } catch (err) {
      console.error(err);
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Could not load post.'
      });
    }
  }

  postModel.findByIdAndUpdate(postId, {
      post: postText,
      updatedAt: new Date()
    }, { new: true })
    .then(() => {
      res.redirect('/user-dashboard'); 
    })
    .catch(err => {
      console.error(err);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Could not update post. Please try again later.'
      });
    });   
}

const addComment = (req, res) => {
  const postId = req.params.id;
  const userId = res.locals.userId;

  if (req.body.body !== "" && postId) {
    const commentData = {
      ...req.body,
      post: postId,
      author: userId
    };

    const newComment = new commentModel(commentData);

    newComment.save()
      .then(savedComment => {
        
        return postModel.findById(postId)
          .then(postInfo => {
            postInfo.comments.push(savedComment._id);
            return postInfo.save();
          })
          .then(() => savedComment); 
      })
      .then(savedComment => {

        return userModule.findById(userId)
          .then(user => {
            user.comments.push(savedComment._id);
            return user.save();
          });
      })
      .then(() => {
        res.redirect('/user-dashboard');
      })
      .catch(err => {
        console.error(err);
        res.status(500).render('error', {
          title: 'Error',
          message: 'Could not add comment. Please try again later.'
        });
      });
  } else {
    res.status(400).render('error', {
      title: 'Invalid input',
      message: 'Comment cannot be empty.'
    });
  }
}

const delComment = async (req, res) => {
  const commentId = req.params.commentId;
  const postId = req.params.id;
  const userId = res.locals.userId; // Get the ID of the logged-in user

  try {
    const deletedComment = await commentModel.findById(commentId);

    // 1. Check if the comment exists
    if (!deletedComment) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Comment not found.'
      });
    }

    // 2. Check if the user is the author of the comment
    if (deletedComment.author.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Unauthorized',
        message: 'You can only delete your own comments.'
      });
    }

    // 3. Delete the comment from the database
    await commentModel.findByIdAndDelete(commentId);

    // 4. Remove the comment ID from the associated post
    const postInfo = await postModel.findById(postId);
    if (postInfo) {
      postInfo.comments = postInfo.comments.filter(
        comment => comment.toString() !== commentId
      );
      await postInfo.save();
    }

    // 5. Remove the comment ID from the user
    const userInfo = await userModule.findById(userId);
    if (userInfo) {
      userInfo.comments = userInfo.comments.filter(
        comment => comment.toString() !== commentId
      );
      await userInfo.save();
    }

    // 6. Redirect after successful deletion
    res.redirect('/user-dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Could not delete comment. Please try again later.'
    });
  }
}

const notFoundPage = (req,res) => {
  res.send('404, Page not found');
}

module.exports = { 
  post,
  dashboard,
  addNewPost,
  showPost,
  deletePost,
  editPostPage,
  editPostForm,
  addComment,
  delComment,
  notFoundPage,
};




// const addNewPost = (req, res) => {
//   let newPost = new postModel(req.body);

//   newPost.save()
//     .then(savedPost => {
//       // const formattedDate = new Date(savedPost.createdAt).toLocaleDateString('en-US', {
//       //   day: 'numeric',
//       //   month: 'long',
//       //   year: 'numeric'
//       // });
      
//       // console.log({
//       //   post: savedPost.post,
//       //   createdAt: formattedDate
//       // });

//       res.redirect('/');
//     })
//     // .catch(err => {
//     //   console.log(err);
//     // })
//     .catch(async (err) => {
//       if (err.name === 'ValidationError') {
//         const posts = await postModel.find().sort({ createdAt: -1 });
        
//         res.render('index', {
//           title: 'Posts',
//           posts: posts,
//           errorMessage: err.errors.post.message,
//         });
//       } else {
//         res.status(500).send('Server error');
//       }
//     });
// }


// const delComment = (req, res) => {

//   const commentId = req.params.commentId;
//   const postId = req.params.id;

//   commentModel.findByIdAndDelete(commentId)
//      .then((result) => {

//          postModel.findById(postId)
//            .then(postInfo => {
//                postInfo.comments = postInfo.comments.filter(comment => comment._id.toString() !== commentId);

//                postInfo.save()
//                     .then(() => {
//                           res.redirect('/');
//                      })
//                     .catch(err => {
//                           console.error(err);
//                      })
//            })
//            .catch(err => {
//             console.log(err);
//            })
//      })
//      .catch(err => {
//       console.log(err);
//       res.status(500).render('error', {
//         title: 'Error',
//         message: 'Could not delete comment. Please try again later.'
//       });
//      })
// }

// const deletePost = (req, res) => {
//   const postId = req.params.id;

//   postModel.findByIdAndDelete(postId)
//      .then(() => {
//       res.redirect('/');
//      })
//      .catch(err => {
//       console.log(err);
//       res.status(500).render('error', {
//         title: 'Error',
//         message: 'Could not delete post. Please try again later.'
//       });
//      })
// }

// const dashboard = (req, res) => {

//       postModel.find()
//         .sort({ createdAt: -1 })
//         .populate('comments', '_id body')
//         .then(result => {
//           res.render('dashboard', { 
//             title: 'Posts', 
//             posts: result, 
//             errorMessage: null,
//             username: res.locals.username,
//             userId: res.locals.userId,
//            });
//         })
//         .catch(err => {
//           console.log(err);
//           res.status(500).render('error', {
//             title: 'Error',
//             message: 'Could not load posts. Please try again later.'
//           });
//         })
// }


// const delComment = async (req, res) => {
//   const commentId = req.params.commentId;
//   const postId = req.params.id;

//   try {

//     const deletedComment = await commentModel.findByIdAndDelete(commentId);

//     if (!deletedComment) {
//       return res.status(404).render('error', {
//         title: 'Error',
//         message: 'Comment not found.'
//       });
//     }

//     const postInfo = await postModel.findById(postId);
//     if (postInfo) {
//       postInfo.comments = postInfo.comments.filter(
//         comment => comment.toString() !== commentId
//       );
//       await postInfo.save();
//     }

//     const userInfo = await userModule.findById(deletedComment.author);
//     if (userInfo) {
//       userInfo.comments = userInfo.comments.filter(
//         comment => comment.toString() !== commentId
//       );
//       await userInfo.save();
//     }

//     res.redirect('/user-dashboard');
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('error', {
//       title: 'Error',
//       message: 'Could not delete comment. Please try again later.'
//     });
//   }
// }