import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import service from '../appwrite/services';
import { Container, PostForm } from '../components';

function EditPost() {
    const [post, setPost] = useState([])
    const slug = useParams();
    const navigate = useNavigate()
    useEffect(() => {
        if (post) {
            service.getPost(slug).then((post) => {
                if (post) {
                    setPost(post)
                }
                else {
                    navigate("/")
                }
            })
        }
    }, [navigate, post])
    return post ? (
        <div className="py-8">
            <Container>
                <PostForm post={post} />
            </Container>
        </div>
    ) : null
}

export default EditPost
