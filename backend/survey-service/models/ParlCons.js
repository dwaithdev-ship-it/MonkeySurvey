const mongoose = require('mongoose');

const parlConsSchema = new mongoose.Schema({
    parl_name: {
        type: String,
        required: false,
        index: true
    },
    muni_name: {
        type: String,
        required: false,
        index: true
    },
    parliament: {
        type: String,
        index: true
    },
    assembly: {
        type: String,
        index: true
    },
    mandal: {
        type: String,
        index: true
    }
}, {
    timestamps: true,
    collection: 'parl_cons',
    strict: false
});

// Compound index to ensure uniqueness of pairs if needed, 
// though the user might want multiple entries.
parlConsSchema.index({ parl_name: 1, muni_name: 1 }, { unique: true });

module.exports = mongoose.model('ParlCons', parlConsSchema);
