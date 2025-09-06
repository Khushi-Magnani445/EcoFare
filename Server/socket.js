const userModel = require('./models/user');
const Server = require('socket.io')
const {getCaptainInTheRadius} = require('./services/maps.service');
let io;

function InitSocket(server){
    io = Server(server, {
        cors: {
            origin: "*",
            credentials: true,
            methods: ['GET', 'POST']
        }
    });
    
    io.on('connection',(socket)=>{
        //console.log(`Client Connected : ${socket.id}`);
        
        // Handle join event
        socket.on('join', async (data) => {
            //console.log('Join event received:', data);
            const {userId, role, vehicleType} = data;
            
            try {
                // Update user with socket_id
                if(role === 'captain'){
                await userModel.findByIdAndUpdate(userId, {
                    socketId: socket.id
                })
                // Join a room for this vehicle type to enable targeted broadcasts if needed
                if (vehicleType) {
                    socket.join(`captain:${vehicleType}`);
                }
                // Also join a captain-specific room for direct messages
                if (userId) {
                    socket.join(`captain:${userId}`);
                }
                }
                else if(role === 'user'){
                    await userModel.findByIdAndUpdate(userId, {
                        socketId: socket.id
                    });
                    // Join a user-specific room for fallback direct emits
                    if (userId) {
                        socket.join(`user:${userId}`);
                    }
                }
                console.log(`Socket ID ${socket.id} saved for user ${userId}`);
            } catch (error) {
                console.error('Error saving socket_id:', error);
            }
        });

        socket.on('update-location-captain',async (data)=>{
            const {userId,location} = data;
            
            //console.log(`Captain ${userId} updated location to`,location);
            if(!location || !location.ltd || !location.lng){
                return io.emit('error','Invalid location');
            }
            await userModel.findByIdAndUpdate(userId,{
                "captain.location":{
                    type: "Point",
                    coordinates: [location.lng, location.ltd]
                }
            });
            // Broadcast captain's latest location so clients (user app) can track
            io.emit('captain-location', { captainId: userId, location });
            // const captains = await getCaptainInTheRadius(location.ltd,location.lng,2);
            // console.log(captains);
            // io.emit('update-location-captain',captains);
        })
        
        socket.on('disconnect', async () => {
            console.log(`Client Disconnected : ${socket.id}`);
            
            try {
                // Remove socket_id when user disconnects
                await userModel.findOneAndUpdate(
                    { socketId: socket.id },
                    { $unset: { socketId: 1 } }
                );
                console.log(`Socket ID ${socket.id} removed from database`);
            } catch (error) {
                console.error('Error removing socket_id:', error);
            }
        });

        
    });
}

function sendMsgToSocketId(socketId,msgObj){
    if(io){
        console.log("socketId",socketId);
        console.log("msgObj",msgObj);
        io.to(socketId).emit(msgObj.event,msgObj.data);
    }
    else{
        console.log('Socket.io not initialized!');
    }
}

// Fallback: emit to a user-specific room if socketId is not available
function sendMsgToUserRoom(userId, msgObj) {
    if (io) {
        console.log(`Emitting to user room user:${userId}`, msgObj?.event);
        io.to(`user:${userId}`).emit(msgObj.event, msgObj.data);
    } else {
        console.log('Socket.io not initialized!');
    }
}

// Emit to a captain-specific room; safer than relying on a potentially stale socketId
function sendMsgToCaptainRoom(captainUserId, msgObj) {
    if (io) {
        console.log(`Emitting to captain room captain:${captainUserId}`, msgObj?.event);
        io.to(`captain:${captainUserId}`).emit(msgObj.event, msgObj.data);
    } else {
        console.log('Socket.io not initialized!');
    }
}

// Emit to all captains of a given vehicle type (e.g., 'ev_bike', 'car')
function sendMsgToVehicleTypeRoom(vehicleType, msgObj) {
    if (io) {
        console.log(`Emitting to vehicle type room captain:${vehicleType}`, msgObj?.event);
        io.to(`captain:${vehicleType}`).emit(msgObj.event, msgObj.data);
    } else {
        console.log('Socket.io not initialized!');
    }
}

function sendMsgToVehicleTypeRoomHelper(vehicleType, msgObj) {
    sendMsgToVehicleTypeRoom(vehicleType, msgObj);
}

module.exports = {InitSocket,sendMsgToSocketId, sendMsgToUserRoom, sendMsgToCaptainRoom, sendMsgToVehicleTypeRoom, sendMsgToVehicleTypeRoomHelper};