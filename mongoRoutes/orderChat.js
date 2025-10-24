const express = require("express");
const router = express.Router();
const orderChatService = require("../mongoServices/orderChat");

router
    .post("/chat", orderChatService.chat)
    .post("/get", orderChatService.get)
    .post("/create", orderChatService.create)
    .put("/update", orderChatService.update);
module.exports = router;