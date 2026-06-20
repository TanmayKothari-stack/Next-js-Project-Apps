const express = require('express');
const router = express.Router();
const pool = require("../db/connection.js");
const Hashids = require("hashids/cjs");
const { getIO } = require("../socket/socket.js");

// GET /users
router.post('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM account');
    res.json(result.rows);
});

router.post('/get-users', async (req, res) => {

    let { id } = req.body;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [id] = hashids.decode(id);

    const users = await pool.query("select * from account");

    const chats = await pool.query("select * from chats where (sender_id = $1 or receiver_id = $1) and (deleted is null or deleted <> $1) order by time desc",
        [id]
    );

    const result = users.rows.map(user => ({
        ...user,
        chats: chats.rows.filter(chat => (Number(chat.sender_id) === id && chat.receiver_id === user.id) ||
            (chat.sender_id === user.id && Number(chat.receiver_id) === id))
    }));

    res.json(result);
});

router.get("/user-info", async (req, res) => {
    let { id } = req.query;

    const hashids = new Hashids(process.env.HASHIDS_SALT, 36);
    [id] = hashids.decode(id);

    const result = await pool.query("select * from account where id = $1",
        [id]
    );

    res.json(result.rows[0]);
});

router.post(("/login"), async (req, res) => {

    try {

        const { name, email, phone, register_date, lat, lon, location_type, clerk_id, profile_image } = req.body;

        const result = await pool.query(`insert into account (name, email, phone, register_date, login_date, location, location_type, clerk_id, profile_image, last_seen) values ($1, $2, $3, $4, $5, point($6, $7), $8, $9, $10, $11) 
            on conflict (clerk_id) do update set name = excluded.name, login_date = excluded.login_date, location = excluded.location, location_type = excluded.location_type, profile_image = excluded.profile_image,last_seen = excluded.last_seen
            returning * `,
            [name, email, phone, register_date, "now()", lat, lon, location_type, clerk_id, profile_image, "now()"]
        );

        const io = getIO();

        io.emit('users', result.rows[0]);

        res.json({
            success: true,
            message: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;