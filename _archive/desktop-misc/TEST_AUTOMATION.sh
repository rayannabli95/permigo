#!/bin/bash

# 🤖 AUTOMATION SCRIPT - PermiGo Login Tests
# Teste automatiquement tous les comptes via Supabase API
# Usage: bash TEST_AUTOMATION.sh

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🤖 PermiGo Automated Login Tests"
echo "════════════════════════════════════════════════════════════════"

# Configuration
SUPABASE_URL="https://ivtuheoyfgljujliscwf.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dHVoZW95ZmdsanVqbGlzY3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODI2OTgsImV4cCI6MjA5Mzc1ODY5OH0.NP4V9qjM30qy8cNLf6dO02W_gbuztBqpty_jA8CsbI0"

# Test accounts
declare -A accounts=(
    ["elyne.semaan@autopilot.fr"]="Autopilot2025!"
    ["sherine.nabli@autopilot.fr"]="Autopilot2025!"
    ["latifa.sahli@autopilot.fr"]="Autopilot2025!"
    ["rayan.nabli@autopilot.fr"]="Autopilot2025!"
    ["lassaad.sahli@autopilot.fr"]="Autopilot2025!"
)

# Expected results
declare -A expected=(
    ["elyne.semaan@autopilot.fr"]="nouveau|0"
    ["sherine.nabli@autopilot.fr"]="nouveau|7"
    ["latifa.sahli@autopilot.fr"]="prêt_examen|22"
    ["rayan.nabli@autopilot.fr"]="moniteur"
    ["lassaad.sahli@autopilot.fr"]="moniteur"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Function: Test a single account
test_account() {
    local email=$1
    local password=$2
    local expected_result=$3

    TOTAL=$((TOTAL + 1))
    echo ""
    echo -e "${BLUE}[TEST $TOTAL]${NC} Testing: $email"

    # Call Supabase auth endpoint
    response=$(curl -s -X POST \
        "$SUPABASE_URL/auth/v1/token?grant_type=password" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")

    # Check if auth succeeded
    if echo "$response" | grep -q '"access_token"'; then
        echo -e "${GREEN}✅ Auth OK${NC}"

        # Extract user_id
        user_id=$(echo "$response" | grep -o '"user_id":"[^"]*' | cut -d'"' -f4)
        echo "   User ID: ${user_id:0:12}..."

        # Fetch profile
        profile=$(curl -s -X GET \
            "$SUPABASE_URL/rest/v1/profiles?auth_id=eq.$user_id&select=role,nom,id" \
            -H "apikey: $SUPABASE_KEY")

        if echo "$profile" | grep -q '"role"'; then
            role=$(echo "$profile" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
            nom=$(echo "$profile" | grep -o '"nom":"[^"]*' | cut -d'"' -f4)
            profile_id=$(echo "$profile" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

            echo "   Profile: $nom ($role)"

            # If it's an élève, fetch stats
            if [ "$role" = "eleve" ]; then
                stats=$(curl -s -X GET \
                    "$SUPABASE_URL/rest/v1/eleve_stats?eleve_id=eq.$profile_id&select=etat,heures_suivies" \
                    -H "apikey: $SUPABASE_KEY")

                etat=$(echo "$stats" | grep -o '"etat":"[^"]*' | cut -d'"' -f4)
                heures=$(echo "$stats" | grep -o '"heures_suivies":"[^"]*' | cut -d'"' -f4 | head -1)

                echo "   Stats: ${heures}h, État: $etat"

                # Check expected
                if echo "$expected_result" | grep -q "$etat" && echo "$expected_result" | grep -q "$heures"; then
                    echo -e "${GREEN}✅ PASS - Stats match expected${NC}"
                    PASSED=$((PASSED + 1))
                else
                    echo -e "${RED}❌ FAIL - Stats mismatch. Expected: $expected_result${NC}"
                    FAILED=$((FAILED + 1))
                fi
            else
                # Moniteur or admin
                echo -e "${GREEN}✅ PASS - Role OK: $role${NC}"
                PASSED=$((PASSED + 1))
            fi
        else
            echo -e "${RED}❌ FAIL - Profile not found${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        # Auth failed
        error=$(echo "$response" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
        echo -e "${RED}❌ Auth FAILED${NC}"
        echo "   Error: $error"
        FAILED=$((FAILED + 1))
    fi
}

# Run all tests
echo ""
echo -e "${YELLOW}Starting login tests...${NC}"

for email in "${!accounts[@]}"; do
    password="${accounts[$email]}"
    expected="${expected[$email]}"
    test_account "$email" "$password" "$expected"
done

# Summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo -e "Total:  ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
