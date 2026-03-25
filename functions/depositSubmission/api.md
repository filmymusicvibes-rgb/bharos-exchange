# API Information

Function URL: https://api.lumi.new/v1/functions/p423148470565703680/depositSubmission

## Endpoint
POST JSON payloads to this endpoint.

## Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <user-jwt-token>"
}
```
- Content-Type: required
- Authorization: bearer token (user JWT from Lumi Auth)

## Request Body
```json
{
  "amount": 12,
  "transaction_hash": "0x...",
  "screenshot_url": "https://..."
}
```

### Fields
- `amount` (number, required): Must be exactly 12 USDT
- `transaction_hash` (string, required): Blockchain transaction hash (TXID)
- `screenshot_url` (string, required): Public URL of uploaded transaction screenshot

## Response

### Success (201)
```json
{
  "success": true,
  "message": "Deposit submitted successfully and waiting for admin approval.",
  "data": {
    "deposit_id": "...",
    "user_id": "...",
    "amount": 12,
    "status": "pending",
    "createdAt": "2026-03-13T19:42:52.167Z"
  }
}
```

### Error (400/401/404/500)
```json
{
  "error": "Error message"
}
```

## Usage Example (Lumi SDK - Recommended)

```typescript
const result = await lumi.functions.invoke('depositSubmission', {
  method: 'POST',
  body: {
    amount: 12,
    transaction_hash: '0xE5A419f3327c11877fDDA6f7B4fAe9354D5E846E',
    screenshot_url: 'https://static.lumi.new/...'
  }
})
```

## Usage Example (cURL)

```bash
curl -X POST "https://api.lumi.new/v1/functions/p423148470565703680/depositSubmission" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "amount": 12,
    "transaction_hash": "0xE5A419f3327c11877fDDA6f7B4fAe9354D5E846E",
    "screenshot_url": "https://static.lumi.new/..."
  }'
```

## Error Codes

- 400: Invalid request (missing fields, amount not 12, duplicate transaction hash)
- 401: Unauthorized (missing or invalid JWT token)
- 404: User not found in database
- 500: Internal server error

## Notes

- User must be authenticated (valid JWT token in Authorization header)
- Amount must be exactly 12 USDT (membership activation fee)
- Screenshot must be uploaded to storage before calling this endpoint
- Transaction hash must be unique (cannot submit same TXID twice)
- Deposit status will be "pending" until admin approval
