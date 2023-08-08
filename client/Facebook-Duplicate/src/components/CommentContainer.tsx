import Comment from "./Comment";
import React, { SyntheticEvent } from "react";
import { useNavigate } from 'react-router-dom'
import {config} from "../config";
import axios from 'axios';
import { UserType, RespType, TokenType } from "../Interfaces";

/**
 * CommentContainer Component
 *  
 * @param {Object} props - The component props.
 * @param {Array<string>} props.comments - The array of ids for the comments of a post
 * @param {React.Dispatch<React.SetStateAction<Array<string>>>} props.setComments - A function that updates the comments state
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setCommentsIsHidden - A function that updates the commentsIsHidden state, determines whether the comments are displayed
 * @param {UserType} props.currentUser - The user object containing the user information of the logged-on user
 * @param {String} props.postId - The id of the post the user is viewing
 * @returns {JSX.Element} A React JSX element representing the CommentContainer Component, container for comments of a post
*/
export default function CommentContainer(props: {comments: Array<string>, setComments: React.Dispatch<React.SetStateAction<Array<string>>>, setCommentsIsHidden: React.Dispatch<React.SetStateAction<boolean>>, currentUser: UserType, postID: string}): JSX.Element{
    // Used to navigate routes
    const history = useNavigate();

    // State for loading time for the comment to send
    const [loading, setLoading] = React.useState(false);

    // State for comment input text
    const [commentText, setCommentText] = React.useState("");

    // Sets the error message for the form
    const [error, setError] = React.useState("");

    // Updates the states for inputs
    function handleChange(event : SyntheticEvent){

        const {value} = event.target as HTMLTextAreaElement;
        setCommentText(value);
    }

    // Async Function that calls the backend to create a new comment
    async function submit(){
        // Sets Error state if form is filled incorrectly
        if (commentText == ''){
            setError('Please Enter Text to Post.');
            return;
        }

        if (loading){
            return;
        }

        // Retrieves the token from local storage
        const tokenJSON = localStorage.getItem("token");
        const token : TokenType | null = tokenJSON ? JSON.parse(tokenJSON) as TokenType : null;

        // If the token does not exist, redirected to login page
        if(!token){
            history('/')
        }

        else {
            try{
                // Sets the loading state for the api call
                setLoading(true);
                const headers = {'Content-Type': 'application/json', Authorization: `Bearer ${token.token}`}
                const res : RespType = await axios.post(
                    `${config.apiURL}/createcomment`, 
                    {
                        user: props.currentUser._id,
                        text: commentText,
                        postID: props.postID,
                    },
                    {
                        headers: headers
                    });

                // Checks response message to verify status of the api POST call
                if (res.data.message == 'Success'){
                    // If successful, the form is reset, and states are reset
                    if(document.getElementById('comment-form')){
                        (document.getElementById('comment-form') as HTMLInputElement)!.value = "";
                    }
                    setCommentText('');
                    setError('');
                    // Sets loading state to false after api call
                    setLoading(false);

                    // The new comment id is appended to the comments state
                    props.setComments([...props.comments, res.data.id]);
                }
            } catch(err){
                // Sets loading state to false after api call
                setLoading(false);
                // If error, re-directs to error page
                history('/error');
            }
        }
    }

    // Work-around to ensure a void return is provided to the Onclick attribute instead of a promise
    const handleSubmitOnClick = (e: SyntheticEvent) => {
        e.preventDefault();
        void submit();
    }

    return (
        <div className="comments-popup">
            {/* Top of the comment container window, displays the title and exit button */}
            <div className='comments-top'>
                <h2>Comments</h2>
                <button onClick={() => {props.setCommentsIsHidden(true)}}>✕</button>
            </div>
            {/* Comment container that displays all comments */}
            <div className='comment-container'>
                {props.comments.length > 0 ? props.comments.map((comment) => <Comment key={comment} id={comment}/>) : <div className='comment-nonexistent'>No Comments</div>}
            </div>
            {/* The comment form, users can submit a new comment here */}
            <div className="form-error-post">{error}</div>
            <form className='comment-form'>
                <input id='comment-form' className='comment-input' name='comment' placeholder='Write a comment...' onChange={handleChange}></input>
                {loading ? <img src='/loading.gif' className='about-property-loading'/> : ""}
                {loading ? <span className="material-symbols-rounded send-disabled">send</span> : <button className='send-comment' onClick={handleSubmitOnClick}><span className="material-symbols-rounded send">send</span></button>}
            </form>
        </div>
    )
}