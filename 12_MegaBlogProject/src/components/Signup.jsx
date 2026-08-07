import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { login } from '../store/features/authSlice'
import authService, { AuthService } from '../appwrite/auth'
import { Button, Input, Logo } from '../components'
import { Link, useNavigate } from 'react-router-dom'


function SignUp() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [error, setError] = useState("");
    const signup = async (data) => {
        setError("");
        try {
            const userData = authService.createAccount(data);
            if (userData) {
                const userData = authService.getCurrentUserStatus();
                if (userData) dispatch(login(userData));
                navigate('/');
            }

        } catch (e) {
            setError(e.message)
        }
    }
    return (
        <div className='flex items-center justify-center w-full'>
            <div className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}>
                <div className="mb-2 flex justify-center">
                    <span className="inline-block w-full max-w-25">
                        <Logo width="100%" />
                    </span>
                </div>
            </div>
            <h2 className="text-center text-2xl font-bold leading-tight">Sign in to your account</h2>
            <p className="mt-2 text-center text-base text-black/60">
                Already have an account?&nbsp;
                <Link
                    to="/login"
                    className="font-medium text-primary transition-all duration-200 hover:underline"
                >
                    Login
                </Link>
            </p>
            {error && <p className='text-red-500 text-center'>
                {error}
            </p>
            }
            <form onSubmit={handleSubmit(signup)} className='mt-8'>
                <div className='space-y-5'>
                    <Input
                        label='Full Name'
                        placeholder="Enter Your FullName"
                        type='text'
                        {...register('Name', { required:"true" })}>
                        
                    </Input>
                    <Input
                        label="Email: "
                        type='email'
                        placeholder="Enter Your Email"
                        {...register(email), {
                            required: true,
                            validate: {
                                matchPattern: (value) => {
                                    /^([\w\.\-_]+)?\w+@[\w-_]+(\.\w+){1,}$/.test(value)
                                        || "Email Addres must be a valid Address"
                                }
                            }
                        }}
                    />
                    <Input
                        label="Password: "
                        type="password"
                        placeholder="Enter Your Password"
                        {...register(password), {
                            required: true
                        }}
                    />
                    <Button
                    className="w-full"
                    type="submit">
                        Sign Up
                    </Button>
                </div>

            </form>
        </div>

    )
}

export default SignUp
