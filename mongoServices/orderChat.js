const mm = require('../utilities/globalModule');
const orderChat = require("../modules/orderChat");

exports.chat = async (io) => {


  // io.on("connection", (socket) => {
  //   console.log("A user connected with socket ID:", socket.id);

  //   // JOIN ROOM EVENT
  //   socket.on("join-room", async (data) => {
  //     try {
  //       const { SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID } = data;
  //       // console.log("join-room data:", data);
  //       // Create a room ID using the two user IDs and ORDER_ID (sorted for consistency)
  //       const roomId = [SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID].sort().join("_");
  //       socket.join(roomId);
  //       console.log(`User joined room: ${roomId}`);

  //       
  //     //   const roomjoinedUserid = SENDER_USER_ID
  //     //   let filter = {}

  //     //   filter = {
  //     //     ROOM_ID: roomId,
  //     //     RECIPIENT_USER_ID: roomjoinedUserid,
  //     //     STATUS: "sent"
  //     //   }

  //     // await orderChat.updateMany(filter, {
  //     //     $set: {
  //     //       STATUS: "delivered",
  //     //       IS_DELIVERED: true,
  //     //       RECEIVED_DATE: Date.now()
  //     //     }
  //     //   });

  //     //   io.to(roomId).emit("messages-updated", {update: true});
  //       const messages = await orderChat.find({ ROOM_ID: roomId }).sort({ createdAt: 1 });

  //       socket.emit("previous-messages", messages);
  //       ;
  //     } catch (error) {
  //       console.error("Error joining room:", error);
  //     }
  //   });

  //   // SEND MESSAGE EVENT
  //   socket.on("send-message", async (data) => {
  //     try {
  //       // Construct roomId from sender, recipient, and order ID.
  //       const roomId = [data.SENDER_USER_ID, data.RECIPIENT_USER_ID, data.ORDER_ID].sort().join("_");

  //       // Check if both users are in the room.
  //       const room = io.sockets.adapter.rooms.get(roomId);
  //       // console.log("Current room members:", room);

  //       
  //       // If both users are connected, mark message as "delivered".
  //       if (room) {
  //         data.STATUS = "sent";
  //         data.IS_DELIVERED = true;
  //       } else {
  //         // Otherwise, the message remains "sent".
  //         data.STATUS = "delivered";
  //         data.IS_DELIVERED = false;
  //       }
  //       data.ROOM_ID = roomId;
  //       if (data.ATTACHMENT_URL) {
  //         data.ATTACHMENT_URL = `${data.ATTACHMENT_URL}`;
  //       }
  //       console.log('https://5nrhgj4m-8767.inc1.devtunnels.ms/static/OrderChat/', data.ATTACHMENT_URL)
  //       const newMessage = new orderChat(data);
  //       await newMessage.save();

  //       // Emit the message to everyone in the room.
  //       io.to(roomId).emit("receive-message", newMessage);
  //       ;

  //       //firebase notification
  //       let firebaseID
  //       let methodcall = ''
  //       data.BY_CUSTOMER == true ? firebaseID = data.TECHNICIAN_ID : firebaseID = data.CUSTOMER_ID
  //       data.BY_CUSTOMER == true ? methodcall = mm.sendNotificationToTechnician : methodcall = mm.sendNotificationToCustomer
  //       methodcall(firebaseID, "**New Message**", `${data.MESSAGE}`, "", "J", '1234567890');

  //     } catch (error) {
  //       console.error("Error saving message:", error);
  //     }
  //   });

  //   // READ MESSAGE EVENT – mark messages as "seen" in the database.
  //   socket.on("read-message", async (data) => {
  //     const { messageIds, RECIPIENT_USER_ID, SENDER_USER_ID, ORDER_ID } = data;
  //     try {
  //       
  //       console.log("Message IDs to mark as seen (backend update):", messageIds);

  //       if (!messageIds || !RECIPIENT_USER_ID) {
  //         console.error("Missing messageIds or RECIPIENT_USER_ID");
  //         return;
  //       }

  //       // Update all messages matching the IDs and where RECIPIENT_USER_ID equals the provided value.
  //       //Used for if the multiple messages are not read from the receiver
  //       await orderChat.updateMany(
  //         { _id: { $in: messageIds }, RECIPIENT_USER_ID: RECIPIENT_USER_ID },
  //         { $set: { STATUS: "seen", RECEIVED_DATE: Date.now() } }
  //       );

  //       // Notify the sender that the messages have been seen.
  //       const roomId = [SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID].sort().join("_");
  //       io.to(roomId).emit("message-seen", { messageIds });
  //       ;
  //     } catch (error) {
  //       console.error("Error updating message status:", error);
  //     }
  //   });

  //   // DISCONNECTION EVENT
  //   socket.on("disconnect", () => {
  //     console.log(`User with socket ID ${socket.id} disconnected`);
  //   });
  // });

  io.on("connection", (socket) => {

    // JOIN ROOM EVENT
    console.log("A user connected with socket ID:", socket.id);

    socket.on("join-room", async (data) => {
      try {
        const { SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID } = data;
        // Create a room ID using the two user IDs and ORDER_ID (sorted for consistency)
        const roomId = [SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID].sort().join("_");
        socket.join(roomId);

        // 

        // Update messages that were sent to the joining user (assumed to be SENDER_USER_ID)
        // and that are still marked as "sent"
        const filter = {
          ROOM_ID: roomId,
          RECIPIENT_USER_ID: SENDER_USER_ID,
          STATUS: "sent"
        };

        await orderChat.updateMany(filter, {
          $set: {
            STATUS: "delivered",
            IS_DELIVERED: true,
            RECEIVED_DATE: Date.now()
          }
        });

        // Query the updated messages list
        const messages = await orderChat.find({ ROOM_ID: roomId }).sort({ createdAt: 1 });

        // Broadcast the updated messages to everyone in the room.
        // Since your frontend listens for "previous-messages", it will update its state accordingly.
        io.to(roomId).emit("previous-messages", messages);

        // ;
      } catch (error) {
        console.error("Error joining room:", error);
      }
    });


    // SEND MESSAGE EVENT
    socket.on("send-message", async (data) => {
      try {
        const roomId = [data.SENDER_USER_ID, data.RECIPIENT_USER_ID, data.ORDER_ID]
          .sort()
          .join("_");

        // 

        // Check if recipient is in the room
        const room = io.sockets.adapter.rooms.get(roomId);

        if (room && room.size > 1) {
          data.STATUS = "delivered";
          data.IS_DELIVERED = true;
        } else {
          data.STATUS = "sent";
          data.IS_DELIVERED = false;
        }

        data.ROOM_ID = roomId;

        const newMessage = new orderChat(data);
        await newMessage.save();

        // Emit message
        io.to(roomId).emit("receive-message", newMessage);

        // Update message status if recipient is present
        if (room && room.size > 1) {
          await orderChat.updateOne(
            { _id: newMessage._id, STATUS: 'sent' },
            { $set: { STATUS: "delivered", IS_DELIVERED: true, RECEIVED_DATE: Date.now() } }
          );
        }

        // ;
        //firebase notification
        // let firebaseID
        // let ownerId
        // let methodcall = ''
        // data.BY_CUSTOMER == true ? firebaseID = data.TECHNICIAN_ID : firebaseID = data.CUSTOMER_ID
        // data.BY_CUSTOMER == true ? ownerId = firebaseID = data.CUSTOMER_ID : data.TECHNICIAN_ID
        // data.BY_CUSTOMER == true ? methodcall = mm.sendNotificationToTechnician : methodcall = mm.sendNotificationToCustomer
        // methodcall(firebaseID, firebaseID, "**New Message**", `${data.MESSAGE}`, "", "J", '1234567890');

        //pass data in data4
        if (data.BY_CUSTOMER == true) {
          firebaseID = data.TECHNICIAN_ID;
          mm.sendNotificationToTechnician(data.CUSTOMER_ID,
            firebaseID,
            "**New Message**",
            `${data.MESSAGE}`,
            "",
            "OC",
            '1234567890',
            "OC",
            "C",
            data
          );
        } else {
          firebaseID = data.RECIPIENT_USER_ID;
          // mm.sendNotificationToCustomer(data.TECHNICIAN_ID,
          //   data.CUSTOMER_ID,
          //   "**New Message**",
          //   `${data.MESSAGE}`,
          //   "",
          //   "J",
          //   '1234567890',
          //   "N",
          //   "C",
          //   data
          // );
          mm.sendNotificationToChannel(data.TECHNICIAN_ID,
            `customer_${data.CUSTOMER_ID}_channel`,
            "**New Message**",
            `${data.MESSAGE}`,
            "",
            "O",
            '1234567890',
            "OC",
            "C",
            data
          );

        }

      } catch (error) {
        console.error("Error saving message:", error);
      }
    });


    socket.on("read-message", async (data) => {
      const { messageIds, RECIPIENT_USER_ID, SENDER_USER_ID, ORDER_ID } = data;
      try {

        if (!messageIds || !RECIPIENT_USER_ID) {
          console.error("Missing messageIds or RECIPIENT_USER_ID");
          return;
        }

        await orderChat.updateMany(
          { _id: { $in: messageIds }, RECIPIENT_USER_ID: RECIPIENT_USER_ID },
          { $set: { STATUS: "seen", RECEIVED_DATE: Date.now() } }
        );

        const roomId = [SENDER_USER_ID, RECIPIENT_USER_ID, ORDER_ID].sort().join("_");
        io.to(roomId).emit("message-seen", { messageIds });

      } catch (error) {
        console.error("Error updating message status:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User with socket ID ${socket.id} disconnected`);
    });
  });
};



exports.get = async (req, res) => {
  try {

    const {
      pageIndex = 1,
      pageSize,
      sortKey = "_id",
      sortValue = "DESC",
      searchValue = "",
    } = req.body;

    const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
    const skip = (pageIndex - 1) * pageSize;
    let filter = req.body.filter || {};

    if (searchValue) {
      filter = {
        $or: req.body.searchFields.map(field => ({
          [field]: { $regex: searchValue, $options: "i" }
        }))
      };
    }

    const totalCount = await orderChat.countDocuments(filter);
    const data = await orderChat.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize));

    res.status(200).json({
      code: 200,
      message: "success",
      count: totalCount,
      data
    });
  } catch (error) {
    console.error(error);
    ;
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};

exports.createOLD = async (req, res) => {
  try {
    const data = req.body;
    const newOrderChat = new orderChat(data);
    const savedOrderChat = await newOrderChat.save();
    res.status(200).json({
      code: 200,
      message: "orderChat information saved successfully."
    });
    let TOPIC_NAME
    TOPIC_NAME == true ? `chat_${data.JOB_ID}_technician_${data.TECHNICIAN_ID}_channel` : `chat_${data.JOB_ID}_customer_${data.CUSTOMER_ID}_channel`
    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "**New Message**", `${data.MESSAGE}`, "", "J", '1234567890', "OC");

  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};
//chnaged by pranali 26-03-2025
exports.create = async (req, res) => {
  try {
    const data = req.body;
    const newOrderChat = new orderChat(data);
    const savedOrderChat = await newOrderChat.save();
    res.status(200).json({
      code: 200,

      message: "orderChat information saved successfully."
    });
    var TOPIC_NAME
    // TOPIC_NAME = data.BY_CUSTOMER == true ? `chat_${data.JOB_CARD_ID}_technician_${data.TECHNICIAN_ID}_channel` : `chat_${data.JOB_CARD_ID}_customer_${data.CUSTOMER_ID}_channel`
    if (data.BY_CUSTOMER == true) {
      if (data.IS_FIRST) {
        var TOPIC_NAME =`technician_${data.TECHNICIAN_ID}_channel`
      }
      else {
        var TOPIC_NAME =`chat_${data.JOB_CARD_ID}_technician_${data.TECHNICIAN_ID}_channel`

      }
    }
    else {
      if (data.IS_FIRST) {
        var TOPIC_NAME =`customer_${data.CUSTOMER_ID}_channel`
      }
      else {
        var TOPIC_NAME =`chat_${data.JOB_CARD_ID}_customer_${data.CUSTOMER_ID}_channel`

      }
    }
    console.log("TOPIC_NAME", TOPIC_NAME)

    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, `**New Message ${req.body.ORDER_NUMBER}-${req.body.JOB_CARD_NUMBER}**`, `${data.MESSAGE}`, "", "J", '1234567890', "OC", "C", req.body);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        code: 422,
        message: errors.array(),
      });
    }

    const { ID, ...data } = req.body;

    if (!ID) {
      return res.status(400).json({
        code: 400,
        message: "ID is required for updating.",
      });
    }

    const updateOrderchat = await orderChat.findByIdAndUpdate(ID, data, { new: true });

    if (!updateOrderchat) {
      return res.status(404).json({
        code: 404,
        message: "orderChat not found.",
      });
    }

    res.status(200).json({
      code: 200,
      message: "orderChat information updated successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};
