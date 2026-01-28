const mongoose = require('mongoose');

const parlConsSchema = new mongoose.Schema({
    parl_name: {
        type: String,
        required: true,
        index: true
    },
    muni_name: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'parl_cons'
});

// Compound index to ensure uniqueness of pairs if needed, 
// though the user might want multiple entries.
parlConsSchema.index({ parl_name: 1, muni_name: 1 }, { unique: true });

module.exports = mongoose.model('ParlCons', parlConsSchema);
