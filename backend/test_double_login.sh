#!/bin/bash

# Ensure no other instance is running on 8080
lsof -ti :8080 | xargs kill -9 2>/dev/null
echo "Starting Spring Boot..."
./mvnw clean compile spring-boot:run > spring_boot_test.log 2>&1 &
SPRING_PID=$!

# Wait for application to start
echo "Waiting for app to start..."
timeout=60
while ! curl -s http://localhost:8080/actuator/health >/dev/null; do
  sleep 2
  ((timeout-=2))
  if [ $timeout -le 0 ]; then
    echo "App failed to start. Logs:"
    tail -n 20 spring_boot_test.log
    kill -9 $SPRING_PID
    exit 1
  fi
done
echo "App started successfully!"

EMAIL="double_login_$(date +%s)@example.com"
echo "1. Registering user $EMAIL..."
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\": \"G\", \"lastName\": \"T\", \"email\": \"$EMAIL\", \"password\": \"Test@123\"}" > /dev/null

export PGPASSWORD=password
psql -h localhost -U smartledger -d smartledger_db -c "UPDATE users SET is_email_verified = true WHERE email = '$EMAIL';" > /dev/null

echo "2. First Login..."
LOGIN_OUT1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"Test@123\"}")
echo "$LOGIN_OUT1"

echo "3. Second Login (Testing Unique Constraint Fix)..."
LOGIN_OUT2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"Test@123\"}")
echo "$LOGIN_OUT2"

JWT=$(echo "$LOGIN_OUT2" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH=$(echo "$LOGIN_OUT2" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

echo "4. Refresh Token..."
REFRESH_OUT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:8080/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{
        \"refreshToken\": \"$REFRESH\"
      }")
echo "$REFRESH_OUT"

echo "5. Logout..."
LOGOUT_OUT=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST -H "Authorization: Bearer $JWT" http://localhost:8080/api/auth/logout)
echo "$LOGOUT_OUT"

kill -9 $SPRING_PID
