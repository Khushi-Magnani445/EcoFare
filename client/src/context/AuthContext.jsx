import {  useState, useEffect } from "react";
import AuthDataContext  from "./AuthDataContext";


export function AuthProvider({ children }) {
    const [user, setUser] = useState({
        username: "",
        role: "",
        name: "",
        _id: "",
        email: "",
        phone: ""
    });

    // Load user data from localStorage on component mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing user data from localStorage:", error);
                localStorage.removeItem("user");
            }
        }
    }, []);

    // Update localStorage when user changes
    const updateUser = (newUser) => {
        setUser(newUser);
        if (newUser && Object.keys(newUser).length > 0) {
            localStorage.setItem("user", JSON.stringify(newUser));
        } else {
            localStorage.removeItem("user");
        }
    };

    return (
        <AuthDataContext.Provider value={{ user, setUser: updateUser }}>
            {children}
        </AuthDataContext.Provider>
    );
}
