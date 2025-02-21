#!/bin/bash  

# export $(cat .env | xargs)
# docker run -e PORT -e TOKEN_VALIDATION_URL -p $PORT:3000 whatsapp-web

# --- Configuration ---
VAR_FILE="$1"  # The first argument passed to the script

# --- Error Handling ---

# Check if an argument was provided
if [ -z "$VAR_FILE" ]; then
  echo "Usage: $0 <variable_file>"
  echo "  <variable_file> is the path to the file containing variable definitions."
  exit 1  # Exit with an error code
fi

# Check if the file exists and is readable
if [ ! -r "$VAR_FILE" ]; then
  echo "Error: File '$VAR_FILE' not found or not readable."
  exit 1  # Exit with an error code
fi

echo "Sourcing variables from '$VAR_FILE'..."

export $(cat "$VAR_FILE" | xargs)

# --- (Optional): Verify the variables are set ---
# You can add this section to check if the variables were properly exported.
for VAR in $(grep -oE '^[A-Za-z_]+=' "$VAR_FILE" | cut -d'=' -f1); do
  if [ -n "${!VAR}" ]; then
    echo "Variable '$VAR' is set to: ${!VAR}"
  else
    echo "Warning: Variable '$VAR' is NOT set."
  fi
done

echo "Variables sourced successfully."

echo "Running Docker Container..."

# docker run -e PORT -e AI_API_KEY -p $PORT:$PORT --name chat-bot chat-bot

docker run -p $PORT:$PORT --env-file "$VAR_FILE" --name chat-bot chat-bot

exit 0

# before run this: chmod +x run.sh
# to run: ./run.sh
