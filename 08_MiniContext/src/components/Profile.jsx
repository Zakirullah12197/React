import React, {useContext} from 'react'
import UserContext from '../context/UserContext'

function Profile() {
    const {user} = useContext(UserContext)
    
    if (!user.username) return <div className='text-center text-4xl '>Please Login</div>

    return <div className='text-center text-4xl '>Welcome {user.username}</div>
}

export default Profile