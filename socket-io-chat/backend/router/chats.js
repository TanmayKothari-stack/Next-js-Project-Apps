const express = require('express');
const router = express.Router();
const pool = require("../db/connection.js");
const Hashids = require("hashids/cjs");
const { getIO } = require("../socket/socket.js");


router.get('/', async (req, res) => {
    let { sender_id, receiver_id } = req.query;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    [sender_id] = hashids.decode(sender_id);
    [receiver_id] = hashids.decode(receiver_id);

    const result = await pool.query("select * from chats where (sender_id = $1 and receiver_id = $2 or sender_id = $2 and receiver_id = $1) and (deleted is null or deleted <> $1)",
        [sender_id, receiver_id]
    );

    res.json(result.rows);
});

router.post("/chat", async (req, res) => {
    let { sender_id, sender_name, receiver_id, receiver_name, message } = req.body;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    [sender_id] = hashids.decode(sender_id);
    [receiver_id] = hashids.decode(receiver_id);

    const result = await pool.query("insert into chats (sender_id, sender_name, receiver_id, receiver_name, message, time) values($1, $2, $3, $4, $5, $6) returning * ",
        [sender_id, sender_name, receiver_id, receiver_name, message, "now()"]
    );

    await pool.query("update account set last_seen = $1 where id = $2",
        ["now()", sender_id]);

    const io = getIO();
    io.emit('chat-message', result.rows[0]);
    io.emit('user-online', sender_id);

    res.json(result.rows[0]);

});

router.put("/update", async (req, res) => {
    let { id, senderId, message } = req.body;
    const result = await pool.query("update chats set message = $1, updated = $2 where id = $3 returning * ",
        [message, true, id]
    );

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [senderId] = hashids.decode(senderId);

    await pool.query("update account set last_seen = $1 where id = $2",
        ["now()", senderId]);

    const io = getIO();
    io.emit('chat-message', result.rows[0]);
    io.emit('user-online', senderId);

    res.json(result.rows[0]);
});

router.delete('/delete', async (req, res) => {

    const { messages } = req.body;

    let senderId;
    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    const values = [];

    for (const message of messages) {

        [senderId] = hashids.decode(message.user_id);

        const result = await pool.query(`
            with updated as(
            update chats set deleted = $1 where
            deleted is null and id = $2
            returning id
        )
            delete from chats where id = $2 and not exists
            (select 1 from updated)
        `, [senderId, message.id]);

        values.push({ user_id: senderId, id: message.id })
    }

    await pool.query("update account set last_seen = $1 where id = $2",
        ["now()", senderId]);

    const io = getIO();
    io.emit("chat-message");
    io.emit('user-online', senderId);

    res.json(values);
});

router.delete('/clear-chat', async (req, res) => {

    let { senderId, messages } = req.body;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [senderId] = hashids.decode(senderId);

    const values = [];
    for (const message of messages) {

        const results = await pool.query(`
            with updated as(
                update chats set deleted = $1
                where deleted is null and id = $2
                returning id
            )
                delete from chats where id = $2 and not exists
                (select 1 from updated)
        `,
            [senderId, message.id]);
        values.push({ id: message.id, sender_id: senderId });
    }

    await pool.query("update account set last_seen = $1 where id = $2"
        , ["now()", senderId]
    );

    const io = getIO();
    io.emit("chat-message");
    io.emit('user-online', senderId);

    res.json(values);
});


module.exports = router;