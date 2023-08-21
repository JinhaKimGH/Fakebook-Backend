const User = require("../models/user");
const Post = require('../models/post');
const Comment = require('../models/comment')
const asyncHandler = require("express-async-handler");

// Function that checks the validity of the image's url
function checkImageURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

// Gets the user and returns it given the id
exports.user_get = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        return res.json({ 
            message: "Success", 
            user: user
        });
    } catch (error){
        return res.status(500).json({ 
            message: "User Not Found." 
        });
    }
})

// Updates the user's (given the id) field for bio, gender, profile photo, or birthday depending on the edit_type given
exports.user_update = asyncHandler(async (req, res, next) => {
    const {id, edit_type, content} = req.body;
    try {
        if(edit_type == 'bio'){
            await User.findByIdAndUpdate(
                id, {
                    'bio': content
                });

            return res.json({
                message: "Success"
            });

        } else if (edit_type == 'gender'){
            await User.findByIdAndUpdate(
                id, {
                    'gender': content
                });

            return res.json({
                message: "Success"
            });

        } else if (edit_type == 'pfp'){
            // Checks the image's url to make sure its valid

            if (content == '' || !checkImageURL(content)){
                return res.json({
                    message: "Error, invalid link given."
                });

            } if(checkImageURL(content)) {
                await User.findByIdAndUpdate(
                    id, {
                        'profilePhoto': content
                    });

                return res.json({
                    message: "Success"
                });

            }
        } else if (edit_type == 'birthday'){
            await User.findByIdAndUpdate(
                id, {
                    'birthday': content
                });

            return res.json({
                message: "Success"
            });

        } else{
            return res.json({
                message: "Invalid edit type."
            });
        }
    } catch (error){
        return res.status(500).json({
            message: "User Not Found."
        });
    }
})

// Returns all the users with the given name
exports.user_get_by_name = asyncHandler(async (req, res, next) => {
    const name = req.params.name;
    if(name == ''){
        return res.status(400).json(
            {
                message: "User Not Found."
            });
    }
    const nameArr = name.split(" ");

    try{
        // If first name and last name is given
        if(nameArr.length > 1){
            const users = await User.find(
                {
                    'firstName': nameArr[0], 
                    'lastName': nameArr[1]
                });

            return res.json(
                {
                    message: "Success", 
                    users: users
                });
        
        // If only the first name is given
        } else {
            const users = await User.find(
                {
                    'firstName': nameArr[0]
                });

            return res.json(
                {
                    message: "Success", users: users
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'User Not Found.'
            });
    }

});

// Sends a friend request from one user to another
exports.user_friend_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;

    // If either id's are null, a 404 status error is return
    if(user_id == '' || friend_id == ''){
        return res.status(404).json(
            {
                message: "User Not Found."
            });
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        // Checks if the friend request is invalid (friend request is already being sent one way or the opposite way)
        if(user.friendRequests.includes(friend_id) || user.friends.includes(friend_id) || friend.friendRequests.includes(user_id) || friend.friends.includes(user_id) || user.outGoingFriendRequests.includes(friend_id)){
            return res.status(400).json(
                {
                    message: 'There is already an outgoing request, or you are already friends with this user'
                });

        // Otherwise push the user_id to the friend_id's friendRequests array and pushes the friend_id to the user_id's outGoingFriendRequests
        } else {
            await User.findByIdAndUpdate(
                friend_id, {
                    "$push": {
                        'friendRequests': user_id
                    }
                });
            await User.findByIdAndUpdate(
                user_id, {
                    "$push": {
                        "outGoingFriendRequests": friend_id
                    }
                });
            return res.json(
                {
                    message: "Success"
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'User Not Found.'
            });
    }

});

// Accepts the friend requests from another user
exports.user_accept_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;

    // If either of the id's are null, a 404 error is sent
    if(user_id == '' || friend_id == ''){
        return res.status(404).json(
            {
                message: "User Not Found."
            });
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);
        
        // Checks if there is a valid friendrequest incoming and outgoing
        if(friend.outGoingFriendRequests.includes(user_id) && user.friendRequests.includes(friend_id)){
            await User.findByIdAndUpdate(
                user_id, {
                    "$pull": {
                        'friendRequests': friend_id
                    }, 
                    "$push": {
                        "friends": friend_id
                    }
                });

            await User.findByIdAndUpdate(
                friend_id, {
                    "$pull": {
                        "outGoingFriendRequests": user_id
                    },
                    "$push": {
                        "friends": user_id
                    }
                });
            return res.json(
                {
                    message: "Success"
                });
        } else {
            return res.status(400).json(
                {
                    message: 'There are no requests between these users.'
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'User Not Found.'
            });
    }
});

// Denies the friend request from another user
exports.user_deny_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;

    // If either of the id's are null, a 404 error is sent
    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        // Checks if there is a valid friendrequest incoming and outgoing
        if(user.friendRequests.includes(friend_id) && friend.outGoingFriendRequests.includes(user_id)){
            await User.findByIdAndUpdate(
                user_id, {
                    "$pull": {
                        'friendRequests': friend_id
                    }
                });

            await User.findByIdAndUpdate(
                friend_id, {
                    "$pull": {
                        "outGoingFriendRequests": user_id
                    }
                });

            return res.json(
                {
                    message: "Success"
                });
        } else {
            return res.status(400).json(
                {
                    message: 'There are no requests between these users.'
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'User Not Found.'
            });
    }
});

// Unfriends one user from another
exports.user_unfriend_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;

    // If either of the id's are null, a 404 error is sent
    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        // Checks if both users are friends before unfriending
        if(friend.friends.includes(user_id) && user.friends.includes(friend_id)){
            await User.findByIdAndUpdate(
                user_id, {
                    "$pull": {
                        'friends': friend_id
                    }
                });
            await User.findByIdAndUpdate(
                friend_id, {
                    "$pull": {
                        "friends": user_id
                    }
                });
            return res.json(
                {
                    message: "Success"
                });

        } else {
            return res.status(400).json(
                {
                    message: 'These users are not friends.'
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'User Not Found.'
            });
    }
})

// Gets all the friends of the given user that has a birthday today
exports.user_birthday_get = asyncHandler(async (req, res, next) => {
    const user_id = req.params.id;

    try{
        const user = await User.findById(user_id);

        if(user){
            // Gets todays date
            const today = new Date();
            const currMonth = today.getMonth() + 1; // getMonth() returns 0 - 11
            const currDay = today.getDate();

            const birthdays = await User.find({
                '_id': {
                    '$in': user.friends
                }, 
                '$expr': {
                    '$and': [
                        { 
                            $eq: [{ 
                                $dayOfMonth: '$birthday' 
                            }, currDay] 
                        },
                        { 
                            $eq: [{ 
                                $month: '$birthday' 
                            }, currMonth] 
                        },
                    ],
                }    
            }).select("_id");

            return res.json(
                {
                    message: "Success", 
                    users: birthdays
                });

        } else {
            return res.status(500).json(
                {
                    message: 'User Not Found.'
                });
        }

    } catch (error) {
        return res.status(500).json(
            {
                message: 'Users Not Found.'
            });
    }
})

// Saves a post to the user's savedPosts list
exports.save_post = asyncHandler(async (req, res, next) => {
    const {user_id, post_id} = req.body;

    // If either of the given ids are null a 404 error is sent
    if(user_id == '' || post_id == ''){
        return res.status(404).json(
            {
                message: "User/Post Not Found."
            });
    }

    try{
        const post = await Post.findById(post_id);

        if(post){
            await User.findByIdAndUpdate(
                user_id, {
                    "$push" : {
                        'savedPosts': post_id
                    }
                });
            await Post.findByIdAndUpdate(
                post_id, {
                    "$push" : {
                        'savedBy': user_id
                    }
                });
            return res.json(
                {
                    message: "Success"
                });
        } else {
            return res.status(404).json(
                {
                    message: 'Post not found.'
                });
        }

    } catch (err){
        return res.status(404).json(
            {
                message: 'User/Post not found.'
            });
    }
})

// Unsaves a post and takes it off the user's savedPosts array
exports.unsave_post = asyncHandler(async (req, res, next) => {
    const {user_id, post_id} = req.body;

    // If either of the given ids are null a 404 error is sent
    if(user_id == '' || post_id == ''){
        return res.status(404).json({message: "User/Post Not Found."});
    }

    try{
        const post = await Post.findById(post_id);

        if(post){
            await User.findByIdAndUpdate(
                user_id, {
                    "$pull" : {
                        'savedPosts': post_id
                    }
                });
            await Post.findByIdAndUpdate(
                post_id, {
                    "$pull" : {
                        'savedBy': user_id
                    }
                });
            return res.json(
                {
                    message: "Success"
                });
        } else {
            return res.status(404).json(
                {
                    message: 'Post not found.'
                });
        }

    } catch (err){
        return res.status(404).json(
            {
                message: 'User/Post not found.'
            });
    }
})

// Gets the list of saved posts from the user
exports.get_saved_posts = asyncHandler(async (req, res, next) => {
    const {user_id} = req.params;

    // If the given id is null a 404 error is sent
    if(user_id == ''){
        return res.status(404).json(
            {
                message: "User Not Found."
            });
    } 

    try{
        const user = await User.findById(user_id);

        if(user){
            // Finds the posts that have ids in the savedPosts of the user
            const posts = await Post.find(
                {
                    '_id': {
                        "$in": user.savedPosts
                    } 
                });

            return res.json(
                {
                    message: "Success", 
                    posts: posts
                });
        } else {
            return res.status(404).json(
                {
                    message: 'User not found.'
                });
        }
    } catch (err){
        return res.status(404).json(
            {
                message: "User/Saved Posts not found."
            });
    }
})

// Deletes the user from the database
exports.delete_user = asyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    // If the given id is null a 404 error is sent
    if(user_id == ''){
        return res.status(404).json(
            {
                message: "User Not Found."
            });
    } 

    try{
        const user = await User.findById(user_id);
        if(user.email == "guest@email.com"){
            return res.status(404).json(
                {
                    message: "User Not Found."    
                });
        }

        if (user) {
            // Deletes the user from all other users friends, friendRequests, and outGoingFriendRequests fields
            await User.updateMany(
                {

                }, {
                    "$pull": {
                        'friends': user_id,
                        'friendRequests': user_id,
                        'outGoingFriendRequests': user_id
                    }
                });
            
            
            // Deletes all user interaction with posts and deletes the post
            for(let i = 0; i < user.posts.length; i++){
                await User.updateMany(
                    {
                    }, {
                        "$pull": {
                            'savedPosts': user.posts[i]
                        }
                    });

                await Comment.deleteMany(
                    {
                        '_id': {
                            "$in": user.posts[i].comments
                        }
                    });

                await Post.findByIdAndDelete(user.posts[i]);
            }

            
            // Deletes all the user's comments 
            const commentsToDelete = await Comment.find(
                {
                    'user': user_id
                }).select('_id');

            const commentArray = []
            for (const comment of commentsToDelete){
                commentArray.push(comment._id);
            }

            await Post.updateMany(
                {
                    'comments': {'$in': commentArray}
                },
                {
                    "$pull": { 'comments': {'$in': commentArray}}
                    
                });

            await Comment.deleteMany(
                {
                    'user': user_id
                });

            // Pulls all the user's likes
            await Post.updateMany(
                {

                },
                {
                    '$pull': {
                        "likes": user_id
                    }
                }
            )

            // Deletes the user in the end
            await User.findByIdAndDelete(user_id);

            return res.json(
                {
                    message: "Success"
                });
        }

    } catch (err){
        return res.status(404).json(
            {
                message: 'User/Post not found.'
            });
    }
})

// Gets all recommended friends by mutual friends
exports.get_user_recommended_friends = asyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    // If the given id is null a 404 error is sent
    if(user_id == ''){
        return res.status(404).json(
            {
                message: "User Not Found."
            });
    } 

    try{
        const user = await User.findById(user_id);

        const friends = await User.find(
            {
            '_id': {
                '$in': user.friends
                }
            });

        const mutuals = [];

        for (let i = 0; i < friends.length; i++){
            for (let j = 0; j < friends[i].friends.length; j++){
                let isInArray = mutuals.some(function (friend) {
                    return friend.equals(friends[i].friends[j])
                })

                if (isInArray || user.friends.includes(friends[i].friends[j]) || friends[i].friends[j] == user_id){
                    continue;
                } else {
                    mutuals.push(friends[i].friends[j]);
                }
            }
        }

        return res.json(
            {
                message: 'Success', 
                ids: mutuals
            });

    } catch (err) {
        return res.status(404).json(
            {
                message: 'User not found.'
            });
    }
})