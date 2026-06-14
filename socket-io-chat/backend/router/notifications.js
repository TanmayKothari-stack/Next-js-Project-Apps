const express = require('express');
const router = express.Router();
const pool = require("../db/connection.js");
const Hashids = require("hashids/cjs");
const { getIO } = require("../socket/socket.js");

router.get('/', async (req, res) => {
    let { receiver_id } = req.query;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    [receiver_id] = hashids.decode(receiver_id);

    const result = await pool.query("select * from notifications where receiver_id = $1 and sender_id != $1 and status = $2 order by id desc",
        [receiver_id, false]
    );

    res.json({
        message: result.rows[0],
        count: result.rows.length
    });
    // res.json(receiver_id);
});

router.get('/get-notifications', async (req, res) => {
    let { receiver_id } = req.query;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    [receiver_id] = hashids.decode(receiver_id);

    const result = await pool.query("select * from notifications where receiver_id = $1 and sender_id != $1 order by id desc",
        [receiver_id]
    );

    res.json({
        message: result.rows[0],
        count: result.rows.length
    });
    // res.json(receiver_id);
});

router.post("/notification", async (req, res) => {
    let { sender_id, sender_name, receiver_id, receiver_name, message } = req.body;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);

    [sender_id] = hashids.decode(sender_id);
    [receiver_id] = hashids.decode(receiver_id);

    if (sender_id != receiver_id) {
        const result = await pool.query("insert into notifications (sender_id, sender_name, receiver_id, receiver_name, message, time) values($1, $2, $3, $4, $5, $6) returning * ",
            [sender_id, sender_name, receiver_id, receiver_name, message, "now()"]
        );
        const io = getIO();
        io.emit('notification', result.rows[0]);
        res.json(result.rows[0]);
    }
    else {
        res.json("Notification Sent");
    }

});

router.post('/view', async (req, res) => {
    let { id } = req.body;
    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [id] = hashids.decode(id);
    const result = await pool.query('update notifications set status = $1 where id = $2',
        [true, id]
    );

    res.json(result.rows);
});

router.post('/delete', async (req, res) => {
    let { id } = req.body;
    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [id] = hashids.decode(id);
    const result = await pool.query('delete from notifications where id = $1',
        [id]
    );

    res.json(result.rows);
})

module.exports = router;