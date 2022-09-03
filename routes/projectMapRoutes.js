const express = require('express');
const router = express.Router();


// GET /projectmap/
router.get('/', (req, res) => {
    res.send("GET /projectmap/");
});


// POST /projectmap
router.post('/', (req, res) => {
    res.send("POST /projectmap");
});

module.exports = router;