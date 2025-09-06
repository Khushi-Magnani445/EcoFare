import { useState,useContext } from "react";
import bgImage from "../assets/images/img2.png";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthDataContext  from "../context/AuthDataContext";

function Register() {
  const { setUser } = useContext(AuthDataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "/";
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    role: "",
    vehicleType: "",
    plateNumber: "",
    ecoFriendly: false,
    experienceYears: "",
    color: "",
    capacity: "",
    model: "",
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitted:", formData);
    
    // Prepare data for backend
    const requestData = {
      name: formData.name,
      username: formData.username,
      password: formData.password,
      phone: formData.phone,
      role: formData.role
    };



    // Add captain data if role is captain
    if (formData.role === "captain") {
      requestData.captain = {
        status: "inactive",
        experienceYears: parseInt(formData.experienceYears),
        vehicle: {
          vehicleType: formData.vehicleType,
          plateNumber: formData.plateNumber,
          color: formData.color,
          ecoFriendly: formData.ecoFriendly,
          capacity: parseInt(formData.capacity),
          model: formData.model
        }
      };
      // const userData = {
      //   username: formData.username,
      //   role: formData.role,
      //   name: formData.name
      // }
      // setUser(userData);
      // console.log(userData);
    }

    try{
      const res = await axios.post("https://ecofare-backend.onrender.com/api/auth/register", requestData, {
        withCredentials: true
      });
      alert(res.data.message);
      
      // Create user object with all details for context
      const userData = {
        username: formData.username,
        role: formData.role,
        name: formData.name,
        phone: formData.phone
      };
      
      // Add captain details if role is captain
      if (formData.role === "captain") {
        userData.captain = {
          status: "inactive",
          experienceYears: parseInt(formData.experienceYears),
          vehicle: {
            vehicleType: formData.vehicleType,
            plateNumber: formData.plateNumber,
            color: formData.color,
            ecoFriendly: formData.ecoFriendly,
            capacity: parseInt(formData.capacity),
            model: formData.model
          }
        };
      }
      const userData1 = res.data.user;
      setUser(userData1);
      localStorage.setItem("user", JSON.stringify(userData1));
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      
      // Navigate: prefer redirectTo if present; else role-based
      if (redirectTo) {
        navigate(redirectTo);
      } else if (formData.role === "captain") {
        navigate('/captain/home');
      } else {
        navigate('/');
      }
    }catch(err){
      console.log("Registration Failed!!", err);
      if (err.response && err.response.data && err.response.data.errors) {
        alert("Registration failed: " + err.response.data.errors.map(e => e.msg).join(", "));
      } else {
        alert("Registration Unsuccessful!");
      }
    }
  }
  
  return (
    <>
      <div className="relative w-screen min-h-screen overflow-hidden">
        {/* Background image with blur */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 blur-md"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden
        />

        {/* Subtle overlay for contrast */}
        <div className="absolute inset-0 bg-black/40" aria-hidden />

        {/* Content */}
        <div className="relative z-10 w-full min-h-screen flex flex-col items-center px-4">
        <div className="w-full max-w-xl mt-6 bg-white/10 backdrop-blur-md shadow-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl md:text-4xl text-center font-bold text-green-800 mb-6 md:mb-8">
            Register with EcoFare
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 text-white" action='/register' method="post">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  
                  placeholder="Name"
                  onChange={handleChange}
                  required
                  
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                />
              </div>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  name="username"
                  value={formData.username}
                  placeholder="Email"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  placeholder="Password"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                />
              </div>
              <div>
                <label>Phone:</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  placeholder="Phone"
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                />
              </div>
            </div>

            <div>
              <label>Role:</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
              >
                <option value="">Select Role</option>
                <option value="captain">Captain</option>
                <option value="user">User</option>
              </select>
            </div>

            {formData.role === "captain" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Vehicle Type:</label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    >
                      <option value="">Type</option>
                      <option value="ev_bike">EV Bike</option>
                      <option value="bike">Bike</option>
                      <option value="auto">Auto</option>
                      <option value="car">Cab</option>
                      <option value="ev_car">EV Cab</option>
                    </select>
                  </div>

                  <div>
                    <label>Vehicle Number:</label>
                    <input
                      type="text"
                      name="plateNumber"
                      value={formData.plateNumber}
                      placeholder="Number"
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label>Color:</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      placeholder="Color"
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    />
                  </div>

                  <div>
                    <label>Capacity:</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      placeholder="Capacity"
                      min="1"
                      max="5"
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    />
                  </div>

                  <div>
                    <label>Model:</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      placeholder="Model"
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Experience (yrs):</label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      placeholder="Years"
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      name="ecoFriendly"
                      checked={formData.ecoFriendly}
                      onChange={handleChange}
                      className="accent-green-500"
                    />
                    <label>Is your vehicle electric?</label>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
              >
                Register
              </button>
            </div>
            <div className="text-center mt-4 text-white/80">
              <span className="text-sm">Already have an account? </span>
              <Link to="/login" state={{ redirectTo }} className="text-emerald-400 hover:underline">Login</Link>
            </div>
          </form>
        </div>
        </div>
      </div>
    </>
  );
}
export default Register;
