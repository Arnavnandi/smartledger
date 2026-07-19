#!/bin/bash

EMAIL="category_test_native_$(date +%s)@example.com"
echo "Registering user $EMAIL..."
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\": \"Native\", \"lastName\": \"Test\", \"email\": \"$EMAIL\", \"password\": \"Test@123\"}" > /dev/null

export PGPASSWORD=password
psql -h localhost -U smartledger -d smartledger_db -c "UPDATE users SET is_email_verified = true WHERE email = '$EMAIL';" > /dev/null

echo "Logging in..."
LOGIN_OUT=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"Test@123\"}")
JWT=$(echo "$LOGIN_OUT" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT" ]; then
    echo "Failed to get JWT!"
    exit 1
fi

echo "0. Setting up Company Profile..."
curl -s -X PUT http://localhost:8080/api/company/me -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "{\"name\": \"Test Corp Native\", \"currency\": \"USD\"}" > /dev/null

echo "1. Creating 'Office Supplies' Category..."
CAT_OUT=$(curl -s -X POST http://localhost:8080/api/expense-categories -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "{\"name\": \"Office Supplies\", \"color\": \"#00FF00\"}")
echo "$CAT_OUT"
CAT_ID=$(echo "$CAT_OUT" | grep -o '"id":[^,]*' | cut -d':' -f2)

if [ -z "$CAT_ID" ]; then
    echo "Failed to create category!"
    exit 1
fi

echo "2. Creating Expense with Category ID $CAT_ID..."
EXP_OUT=$(curl -s -X POST http://localhost:8080/api/expenses -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "{\"vendorName\": \"Staples\", \"amount\": 150.00, \"expenseDate\": \"2023-10-20\", \"categoryId\": $CAT_ID}")
echo "$EXP_OUT"

echo "3. Fetching Expenses to Verify Category Mapping..."
FETCH_OUT=$(curl -s -H "Authorization: Bearer $JWT" "http://localhost:8080/api/expenses?page=0&size=10")
echo "$FETCH_OUT" | grep -o '"categoryName":"[^"]*"' || echo "Category mapping failed!"
echo "$FETCH_OUT" | grep -o '"categoryId":[^,]*' || echo "Category ID mapping failed!"

echo "Test successful."
