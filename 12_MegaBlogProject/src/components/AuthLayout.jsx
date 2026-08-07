// This component protects routes:
// - If page is private and user is NOT logged in → send to login
// - If page is public and user IS logged in → send to home/dashboard
// - Otherwise show the page normally (children)
//---------------------------------------------------------------------------------
// Route guard: controls access to pages based on login status
//---------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'


function Protected({ children, requiresAuth = true }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true)
    const authStatus = useSelector((state) => state.auth.status);
    useEffect((() => {
        if (requiresAuth && authStatus === false) {
            navigate('/login')
        }
        else if (!requiresAuth && authStatus === true) {       //!requiresAuth means that its a public page and a loggedIn user wanna access it
            navigate('/')
        }
        setLoading(false);
    }
    ), [navigate, requiresAuth, authStatus])
    return (loading) ? <h1>Loading...</h1> :<>{children}</>
}

export default Protected
