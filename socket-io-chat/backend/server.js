require('dotenv').config();

const express = require('express');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/socket.js");

const account = require("./router/account.js");
const chats = require("./router/chats.js");
const notifications = require("./router/notifications.js");

const app = express();

app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://pilose-pseudoviperously-hildegarde.ngrok-free.dev"], // Next.js URL
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://pilose-pseudoviperously-hildegarde.ngrok-free.dev"
    ],
    credentials: true
}));

initSocket(io);

const onlineUsers = new Map();

io.on("connection", (socket) => {

    socket.on("user-connected", (userId) => {
        if (userId !== null) {
            onlineUsers.set(userId, socket.id);
            io.emit("user-online");
        }
    });

    socket.on("check-user", (receiverId, callback) => {
        callback(onlineUsers.has(receiverId));
        // console.log(onlineUsers);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers) {
            if (socket.id === socketId) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit("user-offline");
    });

});

app.use("/api/account/", account);
app.use("/api/chats/", chats);
app.use("/api/notifications/", notifications);

server.listen(5000, () => {
    console.log('Server running on port 5000');
});