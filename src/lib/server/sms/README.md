# SMS (OTP)

Production OTP delivery uses **Kavenegar** when `NODE_ENV=production`.

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `SMS_PROVIDER` | no | Default `kavenegar` |
| `KAVENEGAR_API_KEY` | yes (prod) | API key from Kavenegar panel |
| `KAVENEGAR_OTP_TEMPLATE` | yes (prod) | Verify Lookup template name; token = `%token` |
| `KAVENEGAR_SENDER` | no | Line number for plain SMS fallback |

## Flow

1. `POST /api/auth/otp/request` rate-limits (IP + phone burst/hour/day).
2. OTP stored hashed in DB.
3. Production: `verify/lookup.json` with template; on failure, optional plain SMS if `KAVENEGAR_SENDER` set.
4. Development: no SMS; response includes `otpPreview`.

## Kavenegar template

Create a Verify Lookup template with one token (the 6-digit code). Set `KAVENEGAR_OTP_TEMPLATE` to its name.
