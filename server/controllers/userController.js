const User = require("../models/user");
const Post = require('../models/post')
const asyncHandler = require("express-async-handler");

function checkImageURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

const unicodeDecode = (text) => {
    const decoded = text.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
    return decoded;
};

exports.user_get = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({ message: "Success", user: user})
    } catch (error){
        return res.status(500).json({ message: "User Not Found." });
    }
})

exports.user_update = asyncHandler(async (req, res, next) => {
    const {id, edit_type, content} = req.body;
    try {
        if(edit_type == 'bio'){
            await User.findByIdAndUpdate(id, {'bio': content});
            return res.json({message: "Success"});
        } else if (edit_type == 'gender'){
            await User.findByIdAndUpdate(id, {'gender': content});
            return res.json({message: "Success"});
        } else if (edit_type == 'pfp'){
            if (content == '' || !checkImageURL(content)){
                return res.json({message: "Error, invalid link given."});
            } if(checkImageURL(content)) {
                await User.findByIdAndUpdate(id, {'profilePhoto': content});
                return res.json({message: "Success"});
            }
        } else if (edit_type == 'birthday'){
            await User.findByIdAndUpdate(id, {'birthday': content});
            return res.json({message: "Success"});
        } else{
            return res.json({message: "Invalid edit type."})
        }
    } catch (error){
        return res.status(500).json({message: "User Not Found."})
    }
})

exports.user_get_by_name = asyncHandler(async (req, res, next) => {
    const name = req.params.name;
    if(name == ''){
        return res.status(400).json({message: "User Not Found."});
    }
    const nameArr = name.split(" ");

    try{
        if(nameArr.length > 1){
            const users = await User.find({'firstName': nameArr[0], 'lastName': nameArr[1]});
            return res.json({message: "Success", users: users});
        } else {
            const users = await User.find({'firstName': nameArr[0]});
            return res.json({message: "Success", users: users});
        }

    } catch (error) {
        return res.status(500).json({message: 'User Not Found.'})
    }

});

exports.user_friend_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;
    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        if(user.friendRequests.includes(friend_id) || user.friends.includes(friend_id) || friend.friendRequests.includes(user_id) || friend.friends.includes(user_id) || user.outGoingFriendRequests.includes(friend_id)){
            return res.status(400).json({message: 'There is already an outgoing request, or you are already friends with this user'});
        } else {
            await User.findByIdAndUpdate(friend_id, {"$push": {'friendRequests': user_id}});
            await User.findByIdAndUpdate(user_id, {"$push": {"outGoingFriendRequests": friend_id}})
            return res.json({message: "Success"});
        }

    } catch (error) {
        return res.status(500).json({message: 'User Not Found.'});
    }

});

exports.user_accept_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;
    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        if(friend.outGoingFriendRequests.includes(user_id) && user.friendRequests.includes(friend_id)){
            await User.findByIdAndUpdate(user_id, {"$pull": {'friendRequests': friend_id}, "$push": {"friends": friend_id}});
            await User.findByIdAndUpdate(friend_id, {"$pull": {"outGoingFriendRequests": user_id}, "$push": {"friends": user_id}})
            return res.json({message: "Success"});
        } else {
            return res.status(400).json({message: 'There are no requests between these users.'});
        }

    } catch (error) {
        return res.status(500).json({message: 'User Not Found.'});
    }
});

exports.user_deny_request_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;
    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        if(user.friendRequests.includes(friend_id) && friend.outGoingFriendRequests.includes(user_id)){
            await User.findByIdAndUpdate(user_id, {"$pull": {'friendRequests': friend_id}});
            await User.findByIdAndUpdate(friend_id, {"$pull": {"outGoingFriendRequests": user_id}})
            return res.json({message: "Success"});
        } else {
            return res.status(400).json({message: 'There are no requests between these users.'});
        }

    } catch (error) {
        return res.status(500).json({message: 'User Not Found.'});
    }
});

exports.user_unfriend_put = asyncHandler(async (req, res, next) => {
    const {user_id, friend_id} = req.body;

    if(user_id == '' || friend_id == ''){
        return res.status(400).json({message: "User Not Found."});
    }

    try{
        const user = await User.findById(user_id);
        const friend = await User.findById(friend_id);

        if(friend.friends.includes(user_id) && user.friends.includes(friend_id)){
            await User.findByIdAndUpdate(user_id, {"$pull": {'friends': friend_id}});
            await User.findByIdAndUpdate(friend_id, {"$pull": {"friends": user_id}})
            return res.json({message: "Success"});
        } else {
            return res.status(400).json({message: 'These users are not friends.'});
        }

    } catch (error) {
        return res.status(500).json({message: 'User Not Found.'});
    }
})

exports.user_birthday_get = asyncHandler(async (req, res, next) => {
    const user_id = req.params.id;

    try{
        const user = await User.findById(user_id);

        if(user){
            const today = new Date();
            const currMonth = today.getMonth() + 1; // getMonth() returns 0 - 11
            const currDay = today.getDate();

            const birthdays = await User.find({
                '_id': {
                    '$in': user.friends
                }, 
                '$expr': {
                    '$and': [
                        { $eq: [{ $dayOfMonth: '$birthday' }, currDay] },
                        { $eq: [{ $month: '$birthday' }, currMonth] },
                    ],
                }    
            }).select("_id");

            return res.json({message: "Success", users: birthdays});

        } else {
            return res.status(500).json({message: 'User Not Found.'});
        }

    } catch (error) {
        return res.status(500).json({message: 'Users Not Found.'});
    }
})

exports.delete_user = asyncHandler(async (req, res, next) => {
    const user_id = req.params.user_id;
    if(user_id == ''){
        return res.status(404).json({message: 'User not found.'});
    }

    try{
        await User.findByIdAndDelete(user_id);
        return res.json({message: "Success"});
    } catch (err) {
        return res.status(404).json({message: 'User not found.'});
    }
})

exports.save_post = asyncHandler(async (req, res, next) => {
    const {user_id, post_id} = req.body;

    if(user_id == '' || post_id == ''){
        return res.status(404).json({message: "User/Post Not Found."});
    }

    try{
        const post = await Post.findById(post_id);

        if(post){
            await User.findByIdAndUpdate(user_id, {"$push" : {'savedPosts': post_id}})
            return res.json({message: "Success"})
        } else {
            return res.status(404).json({message: 'Post not found.'});
        }

    } catch (err){
        return res.status(404).json({message: 'User/Post not found.'});
    }
})

exports.unsave_post = asyncHandler(async (req, res, next) => {
    const {user_id, post_id} = req.body;

    if(user_id == '' || post_id == ''){
        return res.status(404).json({message: "User/Post Not Found."});
    }

    try{
        const post = await Post.findById(post_id);

        if(post){
            await User.findByIdAndUpdate(user_id, {"$pull" : {'savedPosts': post_id}})
            return res.json({message: "Success"})
        } else {
            return res.status(404).json({message: 'Post not found.'});
        }

    } catch (err){
        return res.status(404).json({message: 'User/Post not found.'});
    }
})