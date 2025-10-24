const users = [];

// Join user to chat
exports.addUser = (id, name, room) => {
    
    const user = { id, name, room };

    users.push(user);

    return user;
}

// Get specific online user
exports.getOnlineUser = (id) => {
    return users.find(user => user.id === id);
}

// Disconnect user from chat
exports.disconnetRoom = (id) => {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get online users
exports.getRoomUsers = (room) => {
    return users.filter(user => user.room === room);
}

