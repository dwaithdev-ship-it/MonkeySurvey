#!/bin/bash
echo "Setting up MonkeySurvey Database..."
mongosh < migrations/001_initial_setup.js
echo "Database setup complete!"
