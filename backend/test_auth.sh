#!/bin/bash

# Ensure no other instance is running
lsof -ti :8080 | xargs kill -9 2>/dev/null
echo "Starting Spring Boot..."
./mvnw spring-boot:run > spring_boot.log 2>&1 &
SPRING_PID=$!

# Wait for application to start
echo "Waiting for app to start..."
timeout=60
while ! curl -s http://localhost:8080/actuator/health >/dev/null; do
  sleep 2
  ((timeout-=2))
  if [ $timeout -le 0 ]; then
    echo "App failed to start. Logs:"
    tail -n 20 spring_boot.log
    kill $SPRING_PID
    exit 1
  fi
done
echo "App started successfully!"
echo "----------------------------------------"

EMAIL="test_flow_$(date +%s)@example.com"

echo "1. Registering new user..."
REG_OUT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
        \"firstName\": \"Test\",
        \"lastName\": \"User\",
        \"email\": \"$EMAIL\",
        \"password\": \"Test@123\"
      }")
echo "$REG_OUT"
echo "----------------------------------------"

echo "Extracting verification token from database..."
export PGPASSWORD=password
TOKEN=$(psql -h localhost -U smartledger -d smartledger_db -t -c "SELECT t.token FROM verification_tokens t JOIN users u ON t.user_id = u.id WHERE u.email = '$EMAIL';" | xargs)
echo "Token: $TOKEN"

echo "2. Verifying email..."
VERIFY_OUT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:8080/api/auth/verify-email?token=$TOKEN")
echo "$VERIFY_OUT"
echo "----------------------------------------"

echo "3. Login with the new user..."
LOGIN_OUT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"Test@123\"
      }")
echo "$LOGIN_OUT"
echo "----------------------------------------"

echo "4. Extract JWT token..."
JWT=$(echo "$LOGIN_OUT" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -n "$JWT" ]; then
  echo "JWT successfully extracted: ${JWT:0:20}..."
else
  echo "Failed to extract JWT!"
fi
echo "----------------------------------------"

echo "5. GET /api/auth/me WITHOUT JWT..."
ME_NO_JWT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:8080/api/auth/me)
echo "$ME_NO_JWT"
echo "----------------------------------------"

echo "6. GET /api/auth/me WITH JWT..."
ME_JWT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: Bearer $JWT" http://localhost:8080/api/auth/me)
echo "$ME_JWT"
echo "----------------------------------------"

kill $SPRING_PID
