import React, { useEffect } from 'react';
import { io } from 'socket.io-client';

import SocketDataContext from './SocketDataContext';
const socket = io('https://ecofare-backend.onrender.com');

const SocketProvider = ({ children }) => {
    useEffect(() => {
        socket.on('connect', () => {
            console.log('connected to server');
        });
        socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
    }, []);

    return (
        <SocketDataContext.Provider value={{ socket }}>
            {children}
        </SocketDataContext.Provider>
    );
};

export { SocketProvider };