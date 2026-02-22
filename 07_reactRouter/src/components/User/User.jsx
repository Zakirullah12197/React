import { useParams } from "react-router"
function User() {
    const { id } = useParams();
    return (
        <div className="text-center p-4 text-3xl bg-green-500 font-medium">
            User : {id}
        </div>
    )
}

export default User
