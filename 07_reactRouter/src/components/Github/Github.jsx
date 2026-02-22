import { useEffect, useState } from "react"
import { useLoaderData } from "react-router"

function Github() {
    const data = useLoaderData();
    // const [data, setData] = useState([])
    // useEffect(() => {
    //     fetch('https://api.github.com/users/Zakirullah12197')
    //         .then(res => res.json())
    //         .then(data => {
    //             setData(data)
    //         })
    //         .catch(err => {
    //             throw err;
    //         }
    //         )
    // }, [])
    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-green-400 rounded-xl shadow-lg text-center">
            <img
                src={data.avatar_url}
                alt="Github Picture"
                className="w-32 h-32 rounded-full border-4 border-white shadow-md"
            />

            <div className="text-2xl font-semibold text-gray-900">
                Github followers:{" "}
                <span className="font-bold">{data.followers}</span>
            </div>
        </div>

    )
}

export default Github
export const githubInfoLoader = async () => {
    const response = await fetch('https://api.github.com/users/Zakirullah12197')
    return response.json();
}