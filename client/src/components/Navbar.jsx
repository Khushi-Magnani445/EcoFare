import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthDataContext from '../context/AuthDataContext'
// import logo from '../assets/images/logo2.png'
// import logo2 from '../assets/images/EcoFare 2.png'
import logo from '../assets/images/logo3.png'

function Navbar() {
  const { user, setUser } = useContext(AuthDataContext)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const isAuthed = !!(user && user._id)
  const isCaptain = user?.role === 'captain'

  const BASE_URL = import.meta.env.VITE_BASE_URL

  const logout = async () => {
    const token = localStorage.getItem('token')
    try {
      // Prefer Authorization header; cookie path also works if you rely on cookies
      await axios.get(`${BASE_URL}/auth/logout`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      })
    } catch (e) {
      // Log and proceed to clear client state regardless
      console.warn('Logout request failed (continuing to clear client auth):', e?.response?.data || e?.message)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser({})
      navigate('/login')
    }
  }

  return (
    <nav className="w-full sticky top-0 z-50 bg-gradient-to-r from-[#14321E] via-[#1B3F27] to-[#14321E] text-[#E6F3EA] shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="EcoFare" className="h-18 w-auto" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="font-semibold text-[#E6F3EA] hover:text-[#AEE5B0] transition text-xl">Home</Link>
            <Link to="/about" className="font-semibold text-[#E6F3EA] hover:text-[#AEE5B0] transition text-xl">About</Link>
            <Link to="/book-ride-home" className="font-semibold text-[#E6F3EA] hover:text-[#AEE5B0] transition text-xl">Book Ride</Link>
            <Link to="/rider" className="font-semibold text-[#E6F3EA] hover:text-[#AEE5B0] transition text-xl">Become a Captain</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/captain/home" className='h-10 px-3 bg-[#2E7D32] text-white font-semibold flex items-center justify-center rounded-md hover:bg-[#256628] transition'>
              Captain
            </Link>
            {!isAuthed ? (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Login</Link>
                <Link to="/register" className="px-3 py-2 rounded-md bg-[#2E7D32] text-white font-semibold hover:bg-[#256628] transition">Register</Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {isCaptain ? (
                  <Link to="/captain/home" className="px-3 py-2 rounded-md bg-white/10 text-[#E6F3EA] font-semibold hover:bg-white/15">Dashboard</Link>
                ) : (
                  <Link to="/book-ride-home" className="px-3 py-2 rounded-md bg-white/10 text-[#E6F3EA] font-semibold hover:bg-white/15">Dashboard</Link>
                )}
                <Link to="/profile" className="px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Profile</Link>
                <button onClick={logout} className="px-3 py-2 rounded-md border border-white/20 text-[#E6F3EA] font-semibold hover:bg-white/10">Logout</button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#E6F3EA] hover:bg-white/10 focus:outline-none">
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2 bg-[#14321E]/90">
          <Link onClick={() => setOpen(false)} to="/" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Home</Link>
          <Link onClick={() => setOpen(false)} to="/about" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">About</Link>
          <Link onClick={() => setOpen(false)} to="/book-ride-home" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Book Ride</Link>
          <Link onClick={() => setOpen(false)} to="/rider" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Become a Captain</Link>
          <Link onClick={() => setOpen(false)} to="/captain/home" className='block px-3 py-2 rounded-md bg-[#2E7D32] text-white font-semibold'>Captain</Link>
          {!isAuthed ? (
            <>
              <Link onClick={() => setOpen(false)} to="/login" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Login</Link>
              <Link onClick={() => setOpen(false)} to="/register" className="block px-3 py-2 rounded-md bg-[#2E7D32] text-white font-semibold">Register</Link>
            </>
          ) : (
            <>
              {isCaptain ? (
                <Link onClick={() => setOpen(false)} to="/captain/home" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Dashboard</Link>
              ) : (
                <Link onClick={() => setOpen(false)} to="/book-ride-home" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Dashboard</Link>
              )}
              <Link onClick={() => setOpen(false)} to="/profile" className="block px-3 py-2 rounded-md text-[#E6F3EA] font-semibold hover:bg-white/10">Profile</Link>
              <button onClick={() => { setOpen(false); logout(); }} className="w-full text-left px-3 py-2 rounded-md border border-white/20 text-[#E6F3EA] font-semibold">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
