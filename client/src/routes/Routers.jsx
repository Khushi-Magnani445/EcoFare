
import Login from "../pages/Login"
import Register from "../pages/Register"
import CaptainHome from "../pages/CaptainHome"
import CaptainRiding from "../pages/CaptainRiding"

function Routers({ navigateToPage, currentPage }){
    return(
        <>
            <Register/>
            <Login/>
            {currentPage === 'captainHome' && <CaptainHome navigateToPage={navigateToPage} />}
            {currentPage === 'captainRiding' && <CaptainRiding navigateToPage={navigateToPage} />}
        </>
    )
}
export default Routers