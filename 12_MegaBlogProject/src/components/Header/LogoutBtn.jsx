import { useDispatch } from "react-redux"
import authService from "../../appwrite/auth"

function LogoutBtn() {
    const logoutButtonHandler = () => {
        const dispatch = useDispatch();
        authService.logout()
            .then(
                dispatch(logout())
            )
    }
    return (
        <button
            className='inline-bock px-6 py-2 duration-200 hover:bg-blue-100 rounded-full'
            onClick={logoutButtonHandler}
        >
            LogOut
        </button>
    )
}

export default LogoutBtn
