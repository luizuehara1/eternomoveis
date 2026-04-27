# Security Specification - Eternos Móveis

## 1. Data Invariants
- A product must have a name (string, max 100 chars).
- A product price must be a positive number.
- Only administrators can create, update, or delete products.
- Public can read the product catalog.
- If a product has an originalPrice, it must be >= current price.

## 2. The "Dirty Dozen" Payloads

### P1: Unauthorized Create
**Payload:** `{ "name": "Hack", "price": 0.01, "category": "Sala" }`
**Target:** `/products/hack123`
**Auth:** Guest
**Expected:** PERMISSION_DENIED

### P2: Price Poisoning (Negative Price)
**Payload:** `{ "name": "Sofa", "price": -100, "category": "Sala" }`
**Target:** `/products/sofa1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED

### P3: Mass Change via Client (Admin Flag Spoofing)
**Payload:** `{ "isAdmin": true }`
**Target:** `/admins/my-uid`
**Auth:** User
**Expected:** PERMISSION_DENIED

### P4: ID Poisoning (Extremely long ID)
**Payload:** `{ "name": "Sofa", "price": 100, "category": "Sala" }`
**Target:** `/products/VERY_LONG_ID_THAT_EXCEEDS_128_CHARACTERS...`
**Auth:** Admin
**Expected:** PERMISSION_DENIED

### P5: Missing Required Fields
**Payload:** `{ "price": 100 }`
**Target:** `/products/p1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED

### P6: Type Mismatch (String as Price)
**Payload:** `{ "name": "Sofa", "price": "cheap" }`
**Target:** `/products/p1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED

### P7: Ghost Field Injection
**Payload:** `{ "name": "Sofa", "price": 100, "category": "Sala", "hiddenFlag": "active" }`
**Target:** `/products/p1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED (via hasOnly)

### P8: Original Price Invariant Break
**Payload:** `{ "name": "Sofa", "price": 1000, "originalPrice": 500 }`
**Target:** `/products/p1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED

### P9: Unauthorized Delete
**Target:** `/products/p1`
**Auth:** Guest or Non-Admin User
**Expected:** PERMISSION_DENIED

### P10: PII Access (If users collection existed)
**Target:** `/users/somebody`
**Auth:** Other User
**Expected:** PERMISSION_DENIED

### P11: Query Scraping (Blanket List)
**Query:** `db.collection('products')` without filters.
**Logic:** Rules must still verify read access per document.

### P12: Resource Exhaustion (1MB String)
**Payload:** `{ "name": "A".repeat(1000000), "price": 100 }`
**Target:** `/products/p1`
**Auth:** Admin
**Expected:** PERMISSION_DENIED (via size checks)

## 3. Test Results
*Test runner implementation follows in firestore.rules.test.ts*
