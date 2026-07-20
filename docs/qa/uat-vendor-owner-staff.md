# UAT Checklist - Vendor (Owner / Staff)

## Preconditions

- Vendor owner test account is active.
- Vendor staff test account is linked to same vendor with limited role.
- Vendor status is approved/active for operational routes.
- At least one product can be created in vendor catalog scope.
- Media upload storage path is writable in test environment.

## Step-by-Step Actions

### Owner Flow

1. Login as vendor owner.
2. Open `/vendor/dashboard`.
3. Open `/vendor/products` and create a new product with valid required fields.
4. Upload product image via vendor media endpoint/UI flow.
5. Edit product (price/stock/headline) and save.
6. Submit product for moderation/review.
7. Open `/vendor/orders` and verify scoped order visibility.
8. Open `/vendor/payouts` and verify payout state visibility.

### Staff Flow

1. Logout owner and login as vendor staff.
2. Open `/vendor/dashboard` and `/vendor/products`.
3. Perform allowed product operations (based on staff permissions).
4. Attempt restricted owner-level action if applicable.

## Expected Results

- Owner can execute full product lifecycle within vendor scope.
- Media upload validates type/size/dimensions and returns canonical URL.
- Submit workflow respects state machine and idempotent behavior.
- Vendor data is properly scoped; no cross-vendor leakage.
- Staff role is enforced (allowed actions succeed, restricted actions blocked).
- Operational errors return explicit codes/messages.

## Negative Tests

1. Upload invalid media:
   - wrong MIME/type, too large, invalid dimensions
   - expect `400` with explicit code/message.
2. Submit same product repeatedly:
   - expect idempotent response or safe dedupe behavior.
3. Force invalid publication transition:
   - expect conflict/validation failure.
4. Attempt vendor API access without session:
   - expect `401`.
5. Use staff account for owner-only action:
   - expect `403` or explicit denial.

## Rollback / Cleanup

- Archive or delete test products created during UAT.
- Remove uploaded test media assets when feasible.
- Reset product status from pending states if required by moderation queue policy.
- Revoke temporary vendor staff assignments if they were created for test only.
