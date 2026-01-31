#!/bin/bash
echo "Setting up BodhaSurvey Database..."
mongosh < migrations/001_initial_setup.js
echo "Database setup complete!"
