import React, { SyntheticEvent } from 'react'
import { TokenType, RespType, UserType } from '../Interfaces';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';

/**
 * About Component
 *  
 * @param {Object} props - The component props.
 * @param {React.Dispatch<React.SetStateAction<UserType>>} props.setUser - A function that updates the user state
 * @param {UserType} props.user - The user object containing the user information of the profile you are on
 * @param {boolean} props.isUser - A flag indicating if the current user is viewing their own profile
 * @returns {JSX.Element} A React JSX element representing the About Component, the about section of the profile
*/
export default function About(props: {setUser: React.Dispatch<React.SetStateAction<UserType>>, user: UserType, isUser: boolean}): JSX.Element{
    // State for the selection of a tab on the about section
    const [selection, setSelection] = React.useState('Biography');

    // State for loading time for the comment to send
    const [loading, setLoading] = React.useState(false);

    // State to determine whether user is in edit mode
    const [edit, setEdit] = React.useState(false);

    // Used to navigate routes
    const history = useNavigate();

    // Function which changes the selection to the clicked tab
    function changeSelection(e: SyntheticEvent){
        const input = e.target as HTMLElement;
        setSelection(input.innerText);
    }

    // Closes the edit forms
    function closeForm(e: SyntheticEvent){
        e.preventDefault();

        setEdit(false);
    }

    // IF the user changes the selection, the edit state is set to false
    React.useEffect(() => {
        setEdit(false);
        setLoading(false);
    }, [selection])

    // If user presses edit button, loading is set to false
    React.useEffect(() => {
        setLoading(false);
    }, [edit])
    
    // Submits the updates for the user
    async function submit(){
        // Don't call the api if it is already loading
        if(loading){
            return;
        }

        // Gets the token from local storage
        const tokenJSON = localStorage.getItem("token");
        const token : TokenType | null = tokenJSON ? JSON.parse(tokenJSON) as TokenType : null;

        // Determine whether the user is editing the Bio or Gender
        const isEditBio = document.getElementById('text-bio') as HTMLInputElement;
        let content = '';
        if (isEditBio){
            content = isEditBio.value;
        } else if(document.getElementById('text-gender')) {
            content = (document.getElementById('text-gender') as HTMLInputElement).value;
        } if(content == '') {
            return;
        }
        
        if(token) {
            try{
                // Sets the loading state before the api call
                setLoading(true);
                const edit_type = isEditBio ? 'bio' : 'gender';
                const headers = {'Content-Type': 'application/json', Authorization: `Bearer ${token.token}`}
                // Put request to the backend, sends the user id, what is being edited, and the new content
                const res : RespType = await axios.put(
                    `${config.apiURL}/updateuser/`, 
                    {
                        id: token.user._id,
                        edit_type: edit_type,
                        content: content,
                    },
                    {
                        headers: headers
                    });
                    
                    // If successful, the edit page is closed
                    if (res.data.message == 'Success'){
                        // Sets loading state to false after api call
                        setLoading(false);
                        setEdit(false);
                        // Updates the user state to match what was edited
                        if(isEditBio){
                            props.setUser({...props.user, bio: content});
                        } else {
                            props.setUser({...props.user, gender: content});
                        }
                    } else {
                        // Sets loading state to false after api call
                        setLoading(false);
                        history('/error');
                    }
                } catch (err) {
                    // Sets loading state to false after api call
                    setLoading(false);
                    history('/error');
                }
        } else {
            // If the token doesn't exist, the user is not logged in and is re-directed to the login page
            history('/');
        }
            
    }
    
    // Work-around to ensure a void return is provided to the Onclick attribute instead of a promise
    const handleSubmitOnClick = (e: SyntheticEvent) => {
        e.preventDefault();
        void submit();
    }

    // Dummy Submit on click that only prevents default event of the form, is used when the api call is loading
    const handleDummyOnClick = (e: SyntheticEvent) => {
        e.preventDefault();
        return;
    }

    return( 
        <div className='profile-about'>
            <div className='profile-about-left'>
                <h3>About</h3>
                {/* The different tabs that the user can click to access the different information pages of the user */}
                <ul>
                    {selection == 'Biography' ? <li className='selection-chosen'>Biography</li> : <li className='selection-not-chosen' onClick={changeSelection}>Biography</li>}
                    {selection == 'Contact Info' ? <li className='selection-chosen'>Contact Info</li> : <li className='selection-not-chosen' onClick={changeSelection}>Contact Info</li>}
                    {selection == 'Basic Info' ? <li className='selection-chosen'>Basic Info</li> : <li className='selection-not-chosen' onClick={changeSelection}>Basic Info</li>}
                </ul>
            </div>

            {/* If the user selects the biography tab */}
            {selection == 'Biography' && 
                <div className='profile-about-right'>
                    <div className='title-container'>
                        <h4>Biography</h4>
                        {props.isUser && <div className='edit-button' onClick={() => {setEdit(!edit)}}>Edit</div>}
                    </div>
                    {/* If the edit state is true, the edit form is displayed, otherwise the user's bio is displayed */}
                    {/* Displays a loading gif if props.user has not been properly set yet */}
                    {edit ? 
                        <form className='edit-form'>
                            <textarea className='edit-form-textarea' placeholder='Write a bio to introduce yourself...' id='text-bio'></textarea>
                            <div className='edit-form-buttons'>
                                {loading ? <button className='form-button-cancel disabled' onClick={handleDummyOnClick}>Cancel</button> :<button className='form-button-cancel' onClick={closeForm}>Cancel</button>}
                                {loading ? <button className='form-button-save disabled' onClick={handleDummyOnClick}><img src='/loading.gif' className='about-property-loading'/></button> : <button className='form-button-save' onClick={handleSubmitOnClick}>Save</button>}
                            </div>
                        </form> : 
                        props.user.bio ? <p className='contact-symbol bio'>{props.user.bio}</p> : <div className='loading-container'><img src='/loading.gif' className='about-loading'/></div>}
                </div>
            }

            {/* If the user selects the contact info tab */}
            {selection == 'Contact Info' &&
                <div className='profile-about-right'>
                    <h4>Contact Info</h4>
                    <p className='contact-symbol'><span className="material-symbols-rounded about-button-icon">email</span>{props.user.email ? props.user.email : <img src='/loading.gif' className='about-property-loading'/>}</p>
                    <p className='about-desc'>Email</p>
                </div>
            }

            {/* If the user selects the basic info tab, if the props.user value is not set, a loading gif is shown instead of the null information */}
            {selection == 'Basic Info' &&
                <div className='profile-about-right'>
                    <h4>Basic Info</h4>
                    {/* If the edit state is true, the edit form is displayed, otherwise the basic info is */}
                    {edit ? 
                        <form className='edit-form'>
                            <input className='edit-form-input' placeholder='Enter the gender you identify with...' id='text-gender'/>
                            <div className='edit-form-buttons'>
                                {loading ? <button className='form-button-cancel disabled' onClick={handleDummyOnClick}>Cancel</button> :<button className='form-button-cancel' onClick={closeForm}>Cancel</button>}
                                {loading ? <button className='form-button-save disabled' onClick={handleDummyOnClick}><img src='/loading.gif' className='about-property-loading'/></button> : <button className='form-button-save' onClick={handleSubmitOnClick}>Save</button>}
                            </div>
                        </form> : <div>
                        <div className='contact-symbol'>
                            {/* Display's icon depending on the gender */}
                            {props.user.gender.toLowerCase() == 'male' ? <span className="material-symbols-rounded about-button-icon">man</span> : ""}
                            {props.user.gender.toLowerCase() == 'female' ? <span className="material-symbols-rounded about-button-icon">woman</span> : ""}
                            {props.user.gender.toLowerCase() !== 'male' && props.user.gender.toLowerCase() !== 'female' && <span className="material-symbols-rounded about-button-icon blacked-out">view_agenda</span>}
                            {props.user.gender ? props.user.gender : <img src='/loading.gif' className='about-property-loading'/>}
                            {props.isUser && <div className='edit-button-pencil' onClick={() => {setEdit(!edit)}}><span className="material-symbols-rounded edit-icon">edit</span></div>}
                        </div>
                        <p className='about-desc'>Gender</p>
                        </div>
                        }
                    {/* The birthday, account creation date, and number of posts information is not editable, thus they will display no matter what */}
                    <p className='contact-symbol'>
                        <span className="material-symbols-rounded about-button-icon">cake</span>
                        {props.user.birthday ? new Date(props.user.birthday).toDateString() : <img src='/loading.gif' className='about-property-loading'/>}
                    </p>
                    <p className='about-desc'>Birthday</p>
            
                    <p className='contact-symbol'>
                        <span className="material-symbols-rounded about-button-icon">today</span>
                        {props.user.accountCreationDate ? new Date(props.user.accountCreationDate).toDateString() : <img src='/loading.gif' className='about-property-loading'/>}
                    </p>
                    <p className='about-desc'>Account Creation Date</p>
            
                    <p className='contact-symbol'>
                        <span className='material-symbols-rounded about-button-icon'>format_list_numbered</span>
                        {props.user.posts ? `${props.user.posts.length} Posts` : <img src='/loading.gif' className='about-property-loading'/>}
                    </p>
                    <p className='about-desc'>Total Number of Posts</p>
                </div>
            }

    </div>
    )
}