# Bharos Exchange Backend API Documentation

## Overview
Complete backend system for Bharos Exchange cryptocurrency platform with MongoDB database and Deno serverless functions.

## Database Collections

### 1. users
- **Fields**: email, username, password, referral_code, referred_by, status, creator, createdAt, updatedAt
- **Permissions**: Read (CREATOR_ONLY), Edit (CREATOR_ONLY), Delete (ADMIN_ONLY), Insert (NO_RESTRICTIONS)

### 2. wallets
- **Fields**: user_id, usdt_balance, brs_balance, bep20_wallet_address, creator, createdAt, updatedAt
- **Permissions**: Read (CREATOR_ONLY), Edit (CREATOR_ONLY), Delete (ADMIN_ONLY), Insert (ADMIN_ONLY)

### 3. deposits
- **Fields**: user_id, amount, transaction_hash, screenshot_url, status, admin_notes, creator, createdAt, updatedAt
- **Permissions**: Read (CREATOR_ONLY), Edit (ADMIN_ONLY), Delete (ADMIN_ONLY), Insert (NO_RESTRICTIONS)

### 4. referral_earnings
- **Fields**: user_id, from_user, level, amount, currency, transaction_type, creator, createdAt, updatedAt
- **Permissions**: Read (CREATOR_ONLY), Edit (ADMIN_ONLY), Delete (ADMIN_ONLY), Insert (ADMIN_ONLY)

---

## API Endpoints

### 1. User Registration
**Function**: `userRegistration`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/userRegistration`  
**Method**: POST

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "crypto_trader",
  "password": "SecurePass123",
  "referral_code": "BRS1024"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Registration successful. Please deposit 12 USDT to activate your account.",
  "data": {
    "user_id": "user_001",
    "email": "user@example.com",
    "username": "crypto_trader",
    "referral_code": "BRS2048",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "status": "pending"
  }
}
```

**Response (Error)**:
```json
{
  "error": "Invalid referral code"
}
```

**Features**:
- Validates referral code exists
- Generates unique BRS referral code
- Hashes password with bcrypt
- Auto-creates wallet with BEP20 address
- Sets user status to "pending"

---

### 2. Deposit Submission
**Function**: `depositSubmission`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/depositSubmission`  
**Method**: POST

**Request Body**:
```json
{
  "user_id": "user_001",
  "amount": 12,
  "transaction_hash": "0xabc123def456",
  "screenshot_url": "https://example.com/screenshots/deposit.png"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Deposit submitted successfully. Awaiting admin approval.",
  "data": {
    "deposit_id": "deposit_001",
    "user_id": "user_001",
    "amount": 12,
    "status": "pending",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
}
```

**Features**:
- Verifies user exists
- Prevents duplicate transaction hashes
- Creates pending deposit record

---

### 3. Admin Approve Deposit
**Function**: `adminApproveDeposit`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/adminApproveDeposit`  
**Method**: POST

**Request Body**:
```json
{
  "deposit_id": "deposit_001",
  "admin_notes": "Verified and approved"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Deposit approved successfully",
  "data": {
    "deposit_id": "deposit_001",
    "user_id": "user_001",
    "brs_credited": 150,
    "commissions_distributed": [
      {
        "level": 1,
        "referrer_id": "user_000",
        "amount": 2,
        "earning_id": "earn_001"
      },
      {
        "level": 2,
        "referrer_id": "user_999",
        "amount": 0.8,
        "earning_id": "earn_002"
      }
    ]
  }
}
```

**Features**:
- Updates deposit status to "approved"
- Activates user account
- Credits 150 BRS tokens
- Distributes 12-level referral commissions:
  - Level 1: $2
  - Level 2: $0.80
  - Level 3: $0.75
  - Level 4: $0.65
  - Level 5: $0.55
  - Level 6: $0.50
  - Level 7: $0.45
  - Level 8: $0.40
  - Level 9: $0.35
  - Level 10: $0.30
  - Level 11: $0.25
  - Level 12: $1.00
- Records all commissions in referral_earnings

---

### 4. Admin Get Users
**Function**: `adminGetUsers`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/adminGetUsers`  
**Method**: GET

**Query Parameters**:
- `status` (optional): Filter by status (pending, active, suspended)
- `search` (optional): Search by email, username, or referral code
- `limit` (optional): Number of results (default: 50)
- `skip` (optional): Pagination offset (default: 0)

**Example**:
```
GET /adminGetUsers?status=active&limit=20&skip=0
```

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "user_001",
        "email": "user@example.com",
        "username": "crypto_trader",
        "referral_code": "BRS1024",
        "referred_by": "BRS0001",
        "status": "active",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "wallet": {
          "usdt_balance": 25.5,
          "brs_balance": 150,
          "bep20_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
        }
      }
    ],
    "total": 100,
    "limit": 20,
    "skip": 0
  }
}
```

---

### 5. Admin Get Deposits
**Function**: `adminGetDeposits`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/adminGetDeposits`  
**Method**: GET

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected)
- `limit` (optional): Number of results (default: 50)
- `skip` (optional): Pagination offset (default: 0)

**Example**:
```
GET /adminGetDeposits?status=pending&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deposits": [
      {
        "deposit_id": "deposit_001",
        "user_id": "user_001",
        "user_email": "user@example.com",
        "user_username": "crypto_trader",
        "amount": 12,
        "transaction_hash": "0xabc123def456",
        "screenshot_url": "https://example.com/screenshots/deposit.png",
        "status": "pending",
        "admin_notes": "",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:00:00.000Z"
      }
    ],
    "total": 50,
    "limit": 20,
    "skip": 0
  }
}
```

---

### 6. Get User Referral Network
**Function**: `getUserReferralNetwork`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/getUserReferralNetwork`  
**Method**: GET

**Query Parameters**:
- `user_id` (required): User ID

**Example**:
```
GET /getUserReferralNetwork?user_id=user_001
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "referral_code": "BRS1024",
    "direct_referrals": 5,
    "team_size": 23,
    "total_earnings": 15.75,
    "earnings_by_level": {
      "1": 10,
      "2": 3.2,
      "3": 2.55
    },
    "recent_earnings": [],
    "direct_referral_users": [
      {
        "user_id": "user_002",
        "username": "trader_2",
        "email": "user2@example.com",
        "status": "active",
        "createdAt": "2025-01-20T11:00:00.000Z"
      }
    ]
  }
}
```

**Features**:
- Shows direct referrals count
- Calculates total team size (all 12 levels)
- Summarizes earnings by level
- Lists recent earnings history
- Shows direct referral user details

---

### 7. Get User Wallet
**Function**: `getUserWallet`  
**URL**: `https://api.lumi.new/v1/functions/p423148470565703680/getUserWallet`  
**Method**: GET

**Query Parameters**:
- `user_id` (required): User ID

**Example**:
```
GET /getUserWallet?user_id=user_001
```

**Response**:
```json
{
  "success": true,
  "data": {
    "wallet_id": "wallet_001",
    "user_id": "user_001",
    "usdt_balance": 25.5,
    "brs_balance": 150,
    "bep20_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T12:00:00.000Z"
  }
}
```

**Features**:
- Returns wallet balances (USDT & BRS)
- Provides BEP20 wallet address
- Generates QR code URL for easy deposits

---

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **Referral Validation**: Ensures valid referral codes
3. **Duplicate Prevention**: Checks for existing emails, usernames, transaction hashes
4. **Status Management**: Pending → Active workflow
5. **Admin-Only Actions**: Deposit approval, balance adjustments
6. **Structured Logging**: JSON logs for all operations

---

## Database Permissions

All collections have been configured with appropriate security permissions:

- **users**: Read/Edit (CREATOR_ONLY), Delete (ADMIN_ONLY), Insert (NO_RESTRICTIONS)
- **wallets**: Read/Edit (CREATOR_ONLY), Delete/Insert (ADMIN_ONLY)
- **deposits**: Read (CREATOR_ONLY), Edit/Delete (ADMIN_ONLY), Insert (NO_RESTRICTIONS)
- **referral_earnings**: Read (CREATOR_ONLY), Edit/Delete/Insert (ADMIN_ONLY)

To modify these permissions, go to **Cloud/security** in the Lumi dashboard.

---

## Testing Guide

### 1. Register New User
```bash
curl -X POST "https://api.lumi.new/v1/functions/p423148470565703680/userRegistration" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@bharos.com",
    "username": "test_user",
    "password": "SecurePass123",
    "referral_code": "BRS1024"
  }'
```

### 2. Submit Deposit
```bash
curl -X POST "https://api.lumi.new/v1/functions/p423148470565703680/depositSubmission" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "amount": 12,
    "transaction_hash": "0xtest123",
    "screenshot_url": "https://example.com/proof.png"
  }'
```

### 3. Approve Deposit (Admin)
```bash
curl -X POST "https://api.lumi.new/v1/functions/p423148470565703680/adminApproveDeposit" \
  -H "Content-Type: application/json" \
  -d '{
    "deposit_id": "deposit_001",
    "admin_notes": "Verified"
  }'
```

### 4. Get User Wallet
```bash
curl "https://api.lumi.new/v1/functions/p423148470565703680/getUserWallet?user_id=user_001"
```

---

## Next Steps

1. **Frontend Integration**: Connect React components to these APIs
2. **Admin Dashboard**: Build UI for viewing users, deposits, and approvals
3. **User Dashboard**: Display wallet balances, referral network, earnings
4. **Authentication**: Integrate with Lumi Auth for secure access
5. **File Upload**: Implement screenshot upload for deposit proofs
6. **Notifications**: Add email/webhook notifications for deposit approvals

---

## Support

For issues or questions about the backend implementation:
- Check Deno function logs in Lumi dashboard
- Review API documentation above
- Verify database collection permissions in Cloud/security
