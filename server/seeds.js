const { faker } = require("@faker-js/faker");
const mongoose = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
require('dotenv').config();

mongoose.connect(process.env.MONGODBURI);

// Populates the Database with users

async function createNewUser(){
    try{
        // Creates a new user with Faker
        const new_user = new User({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            gender: faker.person.sexType(),
            birthday: faker.date.birthdate({min: 13, max: 105, mode: 'age'}),
            email: faker.internet.email(),
            accountCreationDate: faker.date.past(),
            password: faker.internet.password(),
            bio: faker.person.bio(),
            profilePhoto: faker.image.avatar(),
        });

        console.log(new_user);

        await new_user.save();
    } catch (err){
        console.log(err);
    }
}

// Populates the database with posts

async function createPosts(){
    try{
        // Finds a random user in the database
        const users = await User.find({});
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        // Adds random users into a likeList array
        const likeList = []

        for (let i = 0; i < Math.floor(Math.random() * users.length - 1); i++){
            likeList.push(users[Math.floor(Math.random() * users.length)]._id)
        }

        // Ensuring that no two are the same
        const uniqueList = [... new Set(likeList)];

        // Creates new post with Faker
        const new_post = new Post({
            user: randomUser._id,
            text: faker.lorem.text(),
            postTime: faker.date.past(),
            likes: uniqueList
        });

        console.log(new_post);

        await new_post.save();
    } catch (err) {
        console.log(err);
    }
}

// Populates the database with comments

async function createComments(){
    try{
        // Finds random post in the database
        const posts = await Post.find({});
        const randomPost = posts[Math.floor(Math.random() * posts.length)];

        // Finds random user to author post
        const users = await User.find({});
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Adds random users into a likeList array
        const likeList = []

        for (let i = 0; i < Math.floor(Math.random() * users.length - 1); i++){
            likeList.push(users[Math.floor(Math.random() * users.length)]._id)
        }

        // Ensuring that no two are the same
        const uniqueList = [... new Set(likeList)];

        // Creating the new comment with faker
        const new_comment = new Comment({
            user: randomUser._id,
            text: faker.lorem.text(),
            commentTime: faker.date.between({from: randomPost.postTime, to: new Date}),
            likes: uniqueList
        });

        console.log(new_comment);

        await new_comment.save();

        // Add comment to post object
        await Post.findByIdAndUpdate(
            randomPost._id, {
                "$push": {
                    "comments": new_comment._id
                }
            });
    } catch (err) {
        console.log(err)
    }
}

async function createFriends(){
    try{
        // Finds two random users to become friends
        const users = await User.find({});
        const randomUser1 = users[Math.floor(Math.random() * users.length)];
        const randomUser2 = users[Math.floor(Math.random() * users.length)];
    
        // If the users are the same or are already friends, don't friend
        if(randomUser1._id == randomUser2._id || randomUser1.friends.includes(randomUser2._id)){
            return;
        }
    
        await User.findByIdAndUpdate(
            randomUser1._id, {
                "$push": {
                    "friends": randomUser2._id
                }
            });

        await User.findByIdAndUpdate(
            randomUser2._id, {
                "$push": {
                    "friends": randomUser1._id
                }
            });

    } catch (err) {
        console.log(err)
    }
}