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

EMAIL="gemini_test_$(date +%s)@example.com"
echo "Registering user $EMAIL..."
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\": \"G\", \"lastName\": \"T\", \"email\": \"$EMAIL\", \"password\": \"Test@123\"}" > /dev/null

export PGPASSWORD=password
psql -h localhost -U smartledger -d smartledger_db -c "UPDATE users SET is_email_verified = true WHERE email = '$EMAIL';" > /dev/null

echo "Logging in..."
LOGIN_OUT=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"Test@123\"}")
JWT=$(echo "$LOGIN_OUT" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT" ]; then
    echo "Failed to get JWT!"
    kill -9 $SPRING_PID
    exit 1
fi

echo "Testing /api/dashboard/insights..."
curl -s -H "Authorization: Bearer $JWT" http://localhost:8080/api/dashboard/insights | grep -o 'Gemini API Key is not configured' || echo "Success! Endpoint responded without configuration error."
curl -s -H "Authorization: Bearer $JWT" http://localhost:8080/api/dashboard/insights | cut -c 1-200

kill -9 $SPRING_PID
