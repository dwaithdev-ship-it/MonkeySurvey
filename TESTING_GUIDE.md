# Testing Guide - Security Enhancements

## Prerequisites
- MongoDB running
- Backend services running (user-service, response-service, api-gateway)
- Frontend development server running
- Modern browser with location services support

## Test Scenarios

### 1. Phone Number Registration

#### Test 1.1: New User Registration
**Steps:**
1. Navigate to `/register`
2. Fill in all required fields:
   - Name: Test User
   - Username: testuser
   - Password: Test@123
   - Company Email: test@example.com
   - Company: Test Company
   - Phone Number: 9876543210
   - Demo Template: Select any
3. Click "Create Account"

**Expected Result:**
- ✅ Account created successfully
- ✅ Redirected to login page
- ✅ Alert shows: "Account created successfully! Please login with your phone number and password."

#### Test 1.2: Duplicate Phone Number
**Steps:**
1. Try to register another user with the same phone number (9876543210)
2. Use different email and username

**Expected Result:**
- ❌ Registration fails
- ❌ Error message: "This phone number is already registered. Please login or use a different phone number."

#### Test 1.3: Invalid Phone Number Format
**Steps:**
1. Enter phone number with less than 10 digits: 987654321
2. Try to submit

**Expected Result:**
- ❌ HTML5 validation error
- ❌ Custom error: "Please enter a valid 10-digit phone number"

---

### 2. Phone Number Login

#### Test 2.1: First Login (Device Registration)
**Steps:**
1. Navigate to `/login`
2. Enter phone number: 9876543210
3. Enter password: Test@123
4. Click Login

**Expected Result:**
- ✅ Login successful
- ✅ Device ID registered in backend
- ✅ Redirected to `/take-survey/1`
- ✅ Location permission prompt appears

**Verify in Database:**
```javascript
db.users.findOne({ phoneNumber: "9876543210" })
// Should have:
// - activeSession.token: <JWT token>
// - activeSession.deviceId: device_<timestamp>_<random>
// - registeredDeviceId: device_<timestamp>_<random>
```

#### Test 2.2: Second Login from Same Device
**Steps:**
1. Logout
2. Login again with same phone number and password
3. Use same browser (same device ID)

**Expected Result:**
- ✅ Login successful
- ✅ New token generated
- ✅ Same device ID recognized

#### Test 2.3: Login from Different Device (Should Fail)
**Steps:**
1. Open browser in incognito mode OR clear localStorage
2. Try to login with same credentials

**Expected Result:**
- ❌ Login fails
- ❌ Error: "You can only login from your registered mobile device. Please use the phone you registered with."

#### Test 2.4: Multiple Login Prevention
**Steps:**
1. Login successfully on Device A
2. Without logging out, open another browser/tab
3. Try to login with same credentials

**Expected Result:**
- ❌ Login fails
- ❌ Error: "You are already logged in on another device. Please logout from that device first or contact admin."

---

### 3. Location Tracking

#### Test 3.1: Location Permission Granted
**Steps:**
1. Login and navigate to survey page
2. When browser asks for location permission, click "Allow"
3. Observe location indicator in header

**Expected Result:**
- ✅ Green indicator shows: "✓ Location Enabled"
- ✅ Console logs: "Location captured: {latitude, longitude}"

#### Test 3.2: Location Permission Denied
**Steps:**
1. Login and navigate to survey page
2. When browser asks for location permission, click "Block"
3. Observe location indicator

**Expected Result:**
- ⚠️ Red indicator shows: "⚠ Location Required"
- ⚠️ Alert: "Location access is required to submit the survey. Please enable location permissions in your browser settings."

#### Test 3.3: Survey Submission Without Location
**Steps:**
1. Block location permissions
2. Fill out survey
3. Try to submit

**Expected Result:**
- ❌ Submission blocked
- ❌ Alert: "Location is required to submit the survey. Please allow location access when prompted."
- ❌ Location permission re-requested

#### Test 3.4: Survey Submission With Location
**Steps:**
1. Allow location permissions
2. Fill out survey completely
3. Submit

**Expected Result:**
- ✅ Survey submitted successfully
- ✅ Response in database has location data

**Verify in Database:**
```javascript
db.msr_responses.findOne().sort({createdAt: -1})
// Should have:
// - location.latitude: <number>
// - location.longitude: <number>
// - googleMapsLink: https://www.google.com/maps?q=<lat>,<lng>
```

---

### 4. Session Management

#### Test 4.1: Logout Clears Session
**Steps:**
1. Login successfully
2. Check browser DevTools > Application > Local Storage
3. Note the token
4. Click Logout

**Expected Result:**
- ✅ Token removed from localStorage
- ✅ User removed from localStorage
- ✅ Redirected to login page

**Verify in Database:**
```javascript
db.users.findOne({ phoneNumber: "9876543210" })
// Should have:
// - activeSession.token: null
// - activeSession.deviceId: null
```

#### Test 4.2: Login After Logout
**Steps:**
1. Logout from Device A
2. Login again on Device A

**Expected Result:**
- ✅ Login successful
- ✅ New session created

---

### 5. Admin vs Regular User

#### Test 5.1: Admin Login (Multiple Devices Allowed)
**Steps:**
1. Login as admin user
2. Note: Admins can login from multiple devices

**Expected Result:**
- ✅ No device restriction for admin
- ✅ Can login from multiple browsers simultaneously

#### Test 5.2: Regular User (Restricted)
**Steps:**
1. Login as regular user (non-admin)

**Expected Result:**
- ✅ Device restriction enforced
- ✅ Single session enforced

---

## Browser Testing

### Test on Different Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## Database Verification Queries

### Check User Registration
```javascript
// Find user by phone number
db.users.findOne({ phoneNumber: "9876543210" })

// Check for duplicate phone numbers
db.users.aggregate([
  { $group: { _id: "$phoneNumber", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### Check Active Sessions
```javascript
// Find all active sessions
db.users.find({ "activeSession.token": { $ne: null } })

// Count active sessions
db.users.countDocuments({ "activeSession.token": { $ne: null } })
```

### Check Location Data in Responses
```javascript
// Find responses with location
db.msr_responses.find({ 
  "location.latitude": { $exists: true },
  "location.longitude": { $exists: true }
}).limit(5)

// Find responses without location (should be 0)
db.msr_responses.find({ 
  $or: [
    { "location.latitude": { $exists: false } },
    { "location.longitude": { $exists: false } }
  ]
}).count()
```

---

## Troubleshooting

### Issue: Location shows N/A
**Solution:**
1. Check browser location permissions
2. Use HTTPS (location API requires secure context)
3. Check browser console for errors
4. Try in different browser

### Issue: Cannot login from new device
**Solution:**
1. This is expected behavior for phone-based auth
2. User must use registered device
3. Admin can reset device binding if needed

### Issue: "Already logged in" error
**Solution:**
1. Logout from previous device/session
2. Or clear active session from database:
```javascript
db.users.updateOne(
  { phoneNumber: "9876543210" },
  { 
    $set: { 
      "activeSession.token": null,
      "activeSession.deviceId": null 
    }
  }
)
```

### Issue: Phone number already exists
**Solution:**
1. Use different phone number
2. Or login with existing credentials
3. Contact admin to remove duplicate

---

## Performance Testing

### Load Test Scenarios
1. Register 100 users simultaneously
2. Login 50 users concurrently
3. Submit 100 survey responses with location
4. Check database for consistency

---

## Security Verification

### Check Security Headers
```bash
# Check CORS settings
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:4000/api/users/login
```

### Verify JWT Tokens
1. Login and copy token from localStorage
2. Use jwt.io to decode
3. Verify payload contains:
   - id: user ID
   - email: user email
   - role: user role
   - iat: issued at
   - exp: expiration

---

## Test Summary Checklist

- [ ] Phone number registration works
- [ ] Duplicate phone numbers blocked
- [ ] Phone number login works
- [ ] Device restriction enforced
- [ ] Multiple login prevented
- [ ] Location permission requested
- [ ] Location indicator displays correctly
- [ ] Survey submission blocked without location
- [ ] Survey submission works with location
- [ ] Logout clears session
- [ ] Admin can use multiple devices
- [ ] Error messages are clear
- [ ] Database constraints working

---

## Bug Report Template

If you find issues, report using this format:

```
**Bug Title:** 
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Screenshots/Logs:**

**Environment:**
- Browser: 
- OS: 
- Date/Time: 
```
