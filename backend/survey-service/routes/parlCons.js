const express = require('express');
const router = express.Router();
const ParlCons = require('../models/ParlCons');
const { authMiddleware } = require('../../shared/auth');

// Get all parl names (unique)
router.get('/parliaments', async (req, res) => {
    try {
        const parliaments = await ParlCons.distinct('parl_name');
        res.json({ success: true, data: parliaments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get municipalities for a parliament
router.get('/municipalities/:parlName', async (req, res) => {
    try {
        const { parlName } = req.params;
        const normalizedName = parlName.trim();

        // Case-insensitive search
        const municipalities = await ParlCons.find({
            parl_name: { $regex: new RegExp('^' + normalizedName + '$', 'i') }
        }).select('muni_name');

        res.json({ success: true, data: municipalities.map(m => m.muni_name) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk insert/Update (Admin only)
router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { data } = req.body; // Array of {parl_name, muni_name}

        // Using bulkWrite for efficiency and to avoid duplicates
        const operations = data.map(item => ({
            updateOne: {
                filter: { parl_name: item.parl_name, muni_name: item.muni_name },
                update: { $set: item },
                upsert: true
            }
        }));

        await ParlCons.bulkWrite(operations);
        res.json({ success: true, message: 'Data synced successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
