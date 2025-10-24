var socketUser = require('./socketUser')
const mm = require('./globalModule');
const { validationResult, body } = require('express-validator');
const async = require('async');

exports.updateStatus = (io, supportKey) => {

    io.on('connection', (socket) => {

        //type = R-UPDATE_RECEIVED_TIMESTAMP, S-UPDATE_SEEN_TIMESTAMP, O-UPDATE_BOTH //bulk

        socket.on('updateStatus', ({ messageIds, room, type }) => {

            var systemDate = mm.getSystemDate();

            try {

                console.log('updateStatus',messageIds, room, type);
                //mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {

                async.eachSeries(messageIds, function iteratorOverElems(record, inner_callback) {

                    var filter = (type == 'R' ? ` RECEIVED_TIMESTAMP = ${systemDate} ` : '') + (type == 'S' ? ` SEEN_TIMESTAMP = ${systemDate} ` : '') + (type == 'O' ? ` RECEIVED_TIMESTAMP = ${systemDate}, SEEN_TIMESTAMP= ${systemDate} ` : '')

                    mm.executeQueryData(`UPDATE CHAT_MESSAGES SET ${filter} CREATED_MODIFIED_DATE = ? where ID = ? `, [systemDate, record], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            inner_callback(error);
                        }
                        else {
                            inner_callback();
                        }
                    });
                }, function subCb(error) {
                    if (error) {
                        socket.to(room).emit('updateStatus', {
                            room: room,
                            messageIds: messageIds,
                            STATUS: 'Error'
                        });
                    } else {
                        socket.to(room).emit('updateStatus', {
                            room: room,
                            messageIds: messageIds,
                            STATUS: 'Success'
                        });
                    }
                });
            } catch (error) {
                console.log(error);
            }

            // socket.broadcast
            //   .to(user.room)
            //   .emit(
            //     'message',
            //     formatMessage("WebCage", `${user.username} has joined the room`)
            //   );

            // Current active users and room name
            // io.to(user.room).emit('roomUsers', {
            //   room: user.room,
            //   users: getIndividualRoomUsers(user.room)
            // });
        });

        socket.on('joinRoom', ({ PERSONAL_STATUS_ID }) => {

            // const user = socketUser.addUser(socket.id, username, room);
            console.log('joinRoom',PERSONAL_STATUS_ID);

            socket.join('USER_' + PERSONAL_STATUS_ID);

            socket.to('USER_' + PERSONAL_STATUS_ID).emit('userJoined', {
                ROOM_ID: 'USER_' + PERSONAL_STATUS_ID
            });

        });

        socket.on('userStatus', ({ room, STATUS }) => {

            //Current active users and room name
            //'USER_' + OWNER_ID + '_' + RECEIVER_EMPLOYEE_ID
            console.log('userStatus',room, STATUS);

            socket.to(room).emit('userStatus', {
                
                STATUS: STATUS
            });
        });


        // console.log('New user connected');
        //emit message from server to user       

        // when server disconnects from user
        socket.on('disconnect', () => {
            console.log('disconnected from user');
        });
    });
}