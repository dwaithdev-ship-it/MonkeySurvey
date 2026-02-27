const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: String, // Storing as String to easily match msr_users _id string if needed
        required: true,
        ref: 'MSRUser'
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    platform: {
        type: String,
        enum: ['Android', 'iOS', 'Web'],
        required: true
    },
    appVersion: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    firstLoginAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'registered_devices'
});

module.exports = mongoose.model('Device', deviceSchema);
