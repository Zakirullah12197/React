import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import authService from "./appwrite/auth"
import { login } from "./store/features/authSlice"
import {Header,Footer} from "./components"
import {Outlet} from "react-router-dom"
function App() {
  const [loading, setLoading] = useState()
  const dispatch = useDispatch()
  useEffect(() => {
    authService.getCurrentUserStatus()
      .then((userData) => {
        if (userData) {
          dispatch(login({ userData }))
        }
      })
      .catch(() => {
        console.log("User Not Found");
      })
      .finally(() => {
        setLoading(false)
      })
  })
  return loading ? (            //return (loading) ? () : ()        simple if else
    null
  )
    : (
      <div>
        <div>
          <Header />
            <main>
              Zakir
              <Outlet/>
            </main>
          <Footer/>
        </div>
      </div>
    )
}

export default App
