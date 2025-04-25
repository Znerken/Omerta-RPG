#!/bin/bash

# Script to make a specific user an admin
# Usage: ./make_admin.sh <username>

if [ -z "$1" ]; then
  echo "Error: Please provide a username"
  echo "Usage: ./make_admin.sh <username>"
  exit 1
fi

USERNAME="$1"

# Get database connection info from environment
DB_URL="$DATABASE_URL"

# Run SQL query to make user an admin
psql "$DB_URL" -c "UPDATE users SET is_admin = true WHERE username ILIKE '$USERNAME' RETURNING id, username, is_admin;"

if [ $? -eq 0 ]; then
  echo "Success: User $USERNAME is now an admin!"
else
  echo "Error: Failed to update user. Make sure the username exists."
  exit 1
fi
