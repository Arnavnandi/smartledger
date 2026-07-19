#!/bin/bash
EMAIL="receipt_test_final_$(date +%s)@example.com"
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\": \"Test\", \"lastName\": \"User\", \"email\": \"$EMAIL\", \"password\": \"Test@123\"}" > /dev/null
export PGPASSWORD=password
psql -h localhost -U smartledger -d smartledger_db -c "UPDATE users SET is_email_verified = true WHERE email = '$EMAIL';" > /dev/null
JWT=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"Test@123\"}" | jq -r .accessToken)

curl -s -X PUT http://localhost:8080/api/company/me -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "{\"name\": \"Test Corp\", \"currency\": \"USD\"}" > /dev/null

echo "Uploading test_receipt.jpg to /api/expenses/upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8080/api/expenses/upload -H "Authorization: Bearer $JWT" -F "file=@test_receipt.jpg")

echo "Upload Response:"
echo $UPLOAD_RESPONSE | jq .

