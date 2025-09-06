import { useState, useContext } from "react"
import axios from 'axios'
import { Link, useLocation, useNavigate } from "react-router-dom"
import AuthDataContext  from "../context/AuthDataContext";

function Login(){
    const { setUser } = useContext(AuthDataContext);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.redirectTo || "/";

    const [loginForm,setLoginForm] = useState({
        username:"",
        password:""
    })
    function handleChange(e){
        const {name,value} = e.target
        setLoginForm({...loginForm,[name]:value})
    }
    async function handleSubmit(e){
        e.preventDefault()
            try{
        const res = await axios.post("http://localhost:5000/api/auth/login",loginForm,{
            withCredentials:true
        });

        if(res.data.token){
          localStorage.setItem("token",res.data.token);
        }
        
        // Set user data in context and localStorage
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        alert(res.data.message);
        
        // Navigate: prefer redirectTo if provided; else role-based
        if (redirectTo) {
          navigate(redirectTo);
        } else if (res.data.user.role === "captain") {
          navigate('/captain/home');
        } else {
          navigate('/');
        }

        }catch(err){
        console.log("Login Failed!!",err);
        alert("Login Unsuccessful!")
        }

    }
    return(
        <>
           <div
        className="w-screen min-h-screen flex flex-col justify-between items-center bg-[#0F1F16] overflow-x-hidden px-4"
      >

        <div className="w-full max-w-xl mt-30 bg-white/10 backdrop-blur-md shadow-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl md:text-4xl text-center font-bold text-emerald-200 mb-6 md:mb-8">
            Login To EcoFare
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 text-white" action='/login' method="post">
            <div>
                <label className="text-[20px]">Email ID:</label>
                <input
                  type="email"
                  name="username"
                  value={loginForm.username}
                  placeholder="Enter Your Email"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 mt-3 rounded bg-white/10 border border-white/20"
                />
              </div>
              <div className="pt-3">
                <label className="text-[20px]">Password:</label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  placeholder="Enter Password"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 mt-3"
                />
              </div>
              <div className="text-center pt-6">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
              >
                Login
              </button>
            </div> 
            <div className="text-center mt-4 text-white/80">
              <span className="text-sm">Not registered yet? </span>
              <Link to="/register" state={{ redirectTo }} className="text-emerald-300 hover:text-emerald-200">Create an account</Link>
            </div>
            </form>
            </div>
            </div> 
        </>
    )
}
export default Login