import { useForm } from "react-hook-form"
import { useSelector } from "react-redux"
import { data, useNavigate } from "react-router-dom"
import appwriteService from "../../appwrite/services"
import { Button, Select, RTE, Input } from "../index"
import { useCallback, useEffect } from "react"

//to add or edit a single post.
function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.slug || "",
            content: post?.content || "",
            status: post?.status || ""
        }
    })
    const navigate = useNavigate();
    const userData = useSelector(state => state.auth.userData)
    const submit = async () => {
        if (post) {
            const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;
        }
        if (file) {
            appwriteService.deleteFile(post.featuredImage);
        }
        const updatedPost = appwriteService.updatePost(post.$id, {
            ...data,
            featuredImage=file ? file.$id : undefined
        })
        if (updatedPost) {
            navigate(`/post/${`updatedPost.$id`}`)
        }
        //If there is already no post then we may create a post
        else {
            if (file) {
                const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;
            }
            const dbPost = appwriteService.createPost({
                ...data,
                userData= userData.$id
            })
            navigate(`/post/${`dbPost.$id`}`)
        }
        const slugTransform = useCallback(value => {
            if (value && typeof value === "string")
                return value
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-zA-Z\d\s]+/g, "-")
                    .replace(/\s/g, "-");

            return "";

        }, [])
        // Whenever the user changes the Title field, automatically update the Slug field.
        // VALUE
        // contains the entire form

        //         {
        //             title: "React",
        //                 slug: "",
        //                     content: "",
        //                         status: "active"
        //         }
        // info
        // contains information about what changed
        //         {
        //             name: "title"
        //         }

        useEffect(() => {
            const subscription = watch((title, { name }) => {
                if (name === title) {
                    setValue('slug', slugTransform(value.title, { shouldValidate=true }))
                }
            })
            return () => {
                subscription.unsubscribe()
            }
        }, [watch, slugTransform, setValue])

    }
    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}    // Image required for new posts only
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
                    {post ? "Update" : "Submit"}    
                </Button>
            </div>
        </form>
    )
}

export default PostForm
