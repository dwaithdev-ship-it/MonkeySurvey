const mongoose = require('mongoose');

const msrUserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    companyEmail: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    demoTemplate: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        default: 'creator'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'msr_users' // Explicitly set as requested
});

// Remove password from JSON output
msrUserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('MSRUser', msrUserSchema);
