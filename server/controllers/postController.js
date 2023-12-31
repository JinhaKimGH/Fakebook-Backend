const User = require("../models/user");
const Post = require('../models/post')
const asyncHandler = require("express-async-handler");

// Function to check if a url is a valid image url
function checkImageURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

// Function to check if string is a valid url
function isValidURL(string) {
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};

// Gets a post from its id
exports.get_post = asyncHandler(async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        // Gives 404 error is post not found
        if(!post) {
            return res.status(404).json(
                {
                    message: 'Post not found.'
                });
        } else {
            return res.json(
                {
                    message: 'Success',  
                    post: post
                });
        }
    } catch (error) {
        return res.status(404).json(
            {
                message: "Post not found."
            });
    }
})
  
// Gets all the posts from one user
exports.user_posts_get = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        // Gives 404 error if user is not found
        if(!user) {
            return res.status(404).json(
                {
                    message: 'User not found.'
                });
        }
        
        const posts = await Post.find(
            {
                '_id': {
                    $in: user.posts
                }
            }).sort(
                {
                    'postTime': -1
                });

        // If the number of posts is zero, a posts not found message is sent
        if(posts.length === 0){
            return res.json(
                {
                    message: "Posts not found"
                });
        }

        // Otherwise return success
        return res.json(
            {
                message: 'Success', 
                posts
            });
    } catch (error){
        return res.status(404).json(
            { 
                message: "Post/User not found" 
            });
    }
})

// Creates a post and sends it to the database
exports.user_create_post = asyncHandler(async (req, res, next) => {
    const {user, text, link, image} = req.body;

    // If the text is null then an error message is sent back
    if(text == ''){
        return res.json(
            {
                message: 'Please Enter Text to Post.'
            });

    // If the text length exceeds 300, then an error message is sent back
    } else if(text.length > 300) {
        return res.status(404).json(
            {
                message: "Exceeded Max Character Limit of 300."
            });
    } else {
        // A post can only contain an image or a link and not both
        if (image != '' & link != ''){
            return res.json(
                {
                    message: 'You may only enter an image link or an external link, not both.'
                });
        }
        // Checks image url and link url
        if ((image == '' || checkImageURL(image)) && (link == '' || isValidURL(link))){
            try{
                const post = new Post(
                    {
                        user: user, 
                        text: text,  
                        link: link, 
                        postTime: new Date(), 
                        image: image
                    });
                await post.save();
                await User.findByIdAndUpdate(
                    user, {
                        "$push": {
                            'posts': post._id
                        }
                    });
                return res.json(
                    {
                        message: "Success", 
                        id: post._id
                    });
            } catch (err){
                return res.status(404).json(
                    {
                        message: "User not found."
                    });
            }
        // Sends error message if image url or external url is not valid
        } else if(image != '' &!checkImageURL(image)){
            return res.json(
                {
                    message: "Please Enter a Valid Image URL."
                });
        } else{
            return res.json(
                {
                    message: "Please Enter a Valid External URL."
                });
        }
    }
});

// Updates the likes of a post, increases/decreases depdning on parameters
exports.update_likes_put = asyncHandler(async (req, res, next) => {
    const {user} = req.body;

    try{
        // If user id is null, 404 error is sent
        if (user == ''){
            return res.status(404).json(
                {
                    message: 'User not found.'
                });
        } else {
            if(req.params.increase == 'increase'){
                const post = await Post.findByIdAndUpdate(
                    req.params.id, {
                        "$push": {
                            'likes': user
                        }
                    });
            } else {
                const post = await Post.findByIdAndUpdate(
                    req.params.id, {
                        "$pull": {
                            'likes': user
                        }
                    });
            }
            res.json(
                {
                    message: 'Success'
                });
        }
    } catch (err) {
        return res.status(404).json(
            {
                message: "Post not found."
            });
    }
});

// Gets posts for the homepage (people you are friends with + your own posts)
exports.get_recent_posts = asyncHandler(async (req, res, next) => {
    const user_id = req.params.user_id;
    // If user id is null, returns 404 error
    if (user_id == ''){
        return res.status(404).json(
            {
                message: 'User not found.'
            });
    } 

    try {
        // Finds the user first
        const curr_user = await User.findById(user_id);
        
        // If the current user does not exist, sends a 404 error
        if(!curr_user){
            return res.status(400).json(
                {
                    message: "Unable to find user"
                });
        }
        
        // Finds all the friends of the user
        const friendsAndUser = [...curr_user.friends, user_id];
        
        // Finds all the posts from the group of friends + user, sorts it by most recent date, and only sends back 50.
        const posts = await Post.find(
            {
                'user': {
                    "$in": friendsAndUser
                }
            }).sort(
                {
                    'postTime': -1
                }).limit(50);

        if(!posts){
            return res.status(404).json(
                {
                    message: "Unable to find posts"
                });
        }

        return res.json(
            {
                message: "Success", 
                posts: posts
            });
    } catch (err) {
        return res.status(404).json(
            {
                message: "Unable to find posts"
            });
    }
})

// Deletes a post
exports.delete_post = asyncHandler(async (req, res, next) => {
    const {post_id, user_id} = req.body;
    // If either the post id or user id is null, a 404 error is set
    if(post_id == '' || user_id == ''){
        return res.status(404).json(
            {
                message: 'Post not found.'
            });
    }

    try{
        const post = await Post.findById(post_id);

        if (post){
            // Pulls the post id from the user's posts array
            await User.findByIdAndUpdate(
                user_id, {
                    "$pull":  {
                        "posts": post_id
                    }
                });
            // Pulls the post id from every user's saved posts
            await User.updateMany(
                {
                    _id: { 
                        "$in": post.savedBy
                    }
                }, {
                    "$pull": {
                        'savedPosts': post_id
                    }
                });
            // Deletes the post at the end
            await Post.findByIdAndDelete(post_id);

            return res.json(
                {
                    message: "Success"
                })
        } else {
            return res.status(404).json(
                {
                    message: 'Post not found.'
                });
        }
    } catch (err) {
        return res.status(404).json(
            {
                message: 'Post not found.'
            });
    }
})