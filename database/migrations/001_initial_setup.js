// MongoDB Migration Script
// Run this script to set up initial database structure

db = db.getSiblingDB('monkeysurvey');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string'
        },
        firstName: {
          bsonType: 'string'
        },
        lastName: {
          bsonType: 'string'
        },
        role: {
          enum: ['admin', 'creator', 'respondent']
        }
      }
    }
  }
});

db.createCollection('surveys');
db.createCollection('responses');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.surveys.createIndex({ createdBy: 1 });
db.surveys.createIndex({ status: 1 });
db.surveys.createIndex({ createdAt: -1 });

db.responses.createIndex({ surveyId: 1 });
db.responses.createIndex({ userId: 1 });
db.responses.createIndex({ createdAt: -1 });

print('MongoDB collections and indexes created successfully');
