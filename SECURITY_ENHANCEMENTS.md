# Security Enhancements - Phone Number Based Authentication

## Overview
This document outlines the security enhancements implemented to address location tracking, phone number authentication, and session management issues.

## Changes Implemented

### 1. **Location Tracking Fixes**

#### Problem
- Location data was showing "N/A" in survey responses because geolocation permissions were denied or not properly handled
- Users could submit surveys without location data

#### Solution
- **Enhanced Location Capture** (`TakeSurvey.jsx`)
  - Added high-accuracy geolocation with proper error handling
  - Implemented descriptive error messages for different failure scenarios:
    - Permission denied
    - Position unavailable
    - Timeout
  - Added visual location status indicator in the survey header
  - Shows green "Location Enabled" when location is captured
  - Shows red "Location Required" when location is missing

- **Location Validation**
  - Survey submission blocked if location is not available
  - Users are prompted to enable location permissions
  - Automatic retry on submission if location is missing

#### Code Changes
```javascript
// Enhanced location capture with better error handling
captureLocation() {
  navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// Validation before submission
if (!location || !location.latitude || !location.longitude) {
  alert('Location is required to submit the survey...');
  return;
}
```

### 2. **Phone Number Based Authentication**

#### Problem
- Users needed to login using their registered phone numbers
- Multiple users could have the same phone number

#### Solution
- **Unique Phone Number Constraint** (`User.js` model)
  - Added `unique: true` to phoneNumber field
  - Made phoneNumber required for respondent users
  - Prevents duplicate phone number registrations

#### Code Changes
```javascript
phoneNumber: {
  type: String,
  required: function() {
    return this.role === 'respondent';
  },
  unique: true,
  trim: true,
  sparse: true,
  index: true
}
```

### 3. **Single Session Per User (Prevent Multiple Logins)**

#### Problem
- Users could login from multiple devices simultaneously
- No way to track or restrict concurrent sessions

#### Solution
- **Active Session Tracking** (`routes/users.js`)
  - Check for existing active session during phone-based login
  - Prevent login if user is already logged in on another device
  - Return `ALREADY_LOGGED_IN` error code with clear message
  - Session cleared only on explicit logout

#### Code Changes
```javascript
// For phone-based login of non-admin users
if (isPhoneLogin && user.role !== 'admin') {
  if (user.activeSession && user.activeSession.token) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ALREADY_LOGGED_IN',
        message: 'You are already logged in on another device...'
      }
    });
  }
}
```

### 4. **Device Restriction (Login Only from Registered Device)**

#### Problem
- Users could login from any device once they had credentials
- No device binding for security

#### Solution
- **Device ID Validation** (`routes/users.js`)
  - Store registered device ID on first login
  - Validate device ID matches on subsequent logins
  - Only phone-based logins for non-admin users are restricted
  - Return `DEVICE_MISMATCH` error if device doesn't match

#### Device ID Generation (`Login.jsx`)
```javascript
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};
```

#### Validation Logic
```javascript
// Validate device ID matches
if (user.registeredDeviceId && deviceId && user.registeredDeviceId !== deviceId) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'DEVICE_MISMATCH',
      message: 'You can only login from your registered device/phone number'
    }
  });
}

// Register device on first login
if (!user.registeredDeviceId && deviceId) {
  user.registeredDeviceId = deviceId;
}
```

### 5. **Enhanced Error Messages**

#### Frontend Error Handling (`Login.jsx`)
```javascript
const errorCode = err.response?.data?.error?.code;

if (errorCode === 'ALREADY_LOGGED_IN') {
  setError('You are already logged in on another device. Please logout from that device first or contact admin.');
} else if (errorCode === 'DEVICE_MISMATCH') {
  setError('You can only login from your registered mobile device. Please use the phone you registered with.');
} else if (errorCode === 'ACCOUNT_DISABLED') {
  setError('Your account has been disabled. Please contact admin.');
} else if (errorCode === 'INVALID_CREDENTIALS') {
  setError('Invalid phone number or password. Please try again.');
}
```

### 6. **Proper Logout Implementation**

#### Backend (`routes/users.js`)
```javascript
router.post('/logout', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.activeSession = {
      token: null,
      deviceId: null,
      loginTime: null,
      ipAddress: null
    };
    await user.save();
  }
});
```

#### Frontend (`TakeSurvey.jsx`)
```javascript
const handleLogout = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    await fetch('/api/users/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/login');
};
```

## Security Flow

### Login Flow for Phone Number Users
1. User enters phone number and password
2. System generates or retrieves device ID from localStorage
3. Backend validates:
   - User exists with that phone number
   - Account is active
   - No active session exists (single session check)
   - Device ID matches registered device (if already registered)
4. If validation passes:
   - Generate JWT token
   - Save active session with device ID
   - Register device ID if first login
5. If validation fails, return specific error code

### Location Capture Flow
1. On survey page load, request geolocation permission
2. Display location status indicator (enabled/required)
3. On submit:
   - Validate location is captured
   - If not, show alert and retry location capture
   - Block submission until location is available

### Logout Flow
1. User clicks logout
2. Frontend calls logout API with token
3. Backend clears active session in database
4. Frontend clears localStorage
5. Redirect to login page

## API Error Codes

| Code | Description | When Triggered |
|------|-------------|----------------|
| `ALREADY_LOGGED_IN` | User has active session on another device | Phone login with existing active session |
| `DEVICE_MISMATCH` | Login attempted from unregistered device | Device ID doesn't match registered ID |
| `ACCOUNT_DISABLED` | Account has been disabled by admin | User account is inactive |
| `INVALID_CREDENTIALS` | Wrong phone number or password | Authentication failed |

## Database Schema Changes

### User Model
```javascript
{
  phoneNumber: {
    type: String,
    required: function() { return this.role === 'respondent'; },
    unique: true,
    trim: true,
    sparse: true,
    index: true
  },
  activeSession: {
    token: String,
    deviceId: String,
    loginTime: Date,
    ipAddress: String
  },
  registeredDeviceId: String
}
```

## Testing Checklist

- [ ] Location permission granted - survey submits with coordinates
- [ ] Location permission denied - shows error, blocks submission
- [ ] Phone number login successful
- [ ] Duplicate phone number registration blocked
- [ ] Second login from same device allowed
- [ ] Second login from different device blocked
- [ ] Logout clears session, allows new login
- [ ] Admin can login from multiple devices
- [ ] Error messages display correctly
- [ ] Location indicator shows correct status

## Benefits

1. **Improved Location Accuracy**
   - High-accuracy mode enabled
   - Better error messages help users troubleshoot
   - Visual feedback on location status

2. **Enhanced Security**
   - One user per phone number
   - One active session per user
   - Device binding prevents unauthorized access
   - Proper session management

3. **Better User Experience**
   - Clear error messages
   - Visual indicators
   - Automatic permission requests
   - Guided troubleshooting

## Migration Notes

### For Existing Users
- Users who already have accounts may need to re-login to register their device
- Existing duplicate phone numbers will need to be cleaned up manually
- Active sessions will be cleared on first logout

### For New Users
- Phone number is required during registration for respondent role
- Device is registered on first login
- Subsequent logins must come from the same device

## Future Enhancements

1. **Admin Portal**
   - View active sessions
   - Force logout users
   - Reset device bindings

2. **Enhanced Device Management**
   - Allow users to register multiple trusted devices
   - Device fingerprinting for better security

3. **Location Fallback**
   - IP-based location as fallback
   - Manual location entry option

4. **Session Management**
   - Session timeout
   - Remember me functionality
   - Session refresh tokens
