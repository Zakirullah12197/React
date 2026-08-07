import React, { useState, useEffect } from 'react'
import service from '../appwrite/services'
import { Container, PostCard } from '../components'

function AllPosts() {
    const [post, setPosts] = useState([])
    useEffect(() => {
        service.getPosts([]).then((posts) => {
            if (posts) {
                setPosts(posts.documents)
            }
        })
    }, [])

    return (
        <div className="py-8 w-full">
            <Container>
                <div className="flex flex-wrap">
                    {posts.map(post => (
                        <div key={post.$id} className="p-2 w-1/4">
                            <PostCard post={post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}

export default AllPosts
