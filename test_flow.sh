#!/bin/bash

echo "=== Testing Criteria Functionality ==="
echo

# 1. Get first university and program
echo "1. Getting first university data..."
FIRST_UNI=$(curl -s http://localhost:3000/api/universidades | python3 -c "
import sys, json
data = json.load(sys.stdin)
uni = data['programas_doctorado']['universidades'][0]
prog = uni['programas'][0]
print(f'Universidad: {uni[\"nombre\"]}')
print(f'Programa: {prog[\"nombre\"]}')
print(f'ID: {prog[\"_id\"]}')
print(f'Criterios actuales: {prog.get(\"criterios\", {})}')
print(prog['_id'])
")

echo "$FIRST_UNI" | head -n 4
PROG_ID=$(echo "$FIRST_UNI" | tail -n 1)

echo
echo "2. Updating criterios for program $PROG_ID..."
curl -X PUT http://localhost:3000/api/programas/$PROG_ID \
  -H "Content-Type: application/json" \
  -d '{
    "criterios": {
      "relevancia": 5,
      "claridad": 4,
      "transparencia": 3,
      "actividades": 4,
      "resultados": 5
    }
  }' 2>/dev/null

echo
echo
echo "3. Verifying update..."
curl -s http://localhost:3000/api/programas/$PROG_ID/criterios | python3 -m json.tool

echo
echo "4. Checking if included in universities API..."
curl -s http://localhost:3000/api/universidades | python3 -c "
import sys, json
data = json.load(sys.stdin)
prog = data['programas_doctorado']['universidades'][0]['programas'][0]
print(f'Criterios in universities API: {prog.get(\"criterios\", \"NOT FOUND\")}')
"

echo
echo "=== Test Complete ==="