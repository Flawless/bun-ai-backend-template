#!/bin/bash

# Don't exit on error - we want to run all checks
set +e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Read hook input from stdin if available
if [ -t 0 ]; then
    # No stdin input, run minimal checks
    echo "Running minimal post-write checks..."
    echo "Running typecheck..."
    bun run type-check
else
    # Parse the JSON input from Claude Code hook using jq
    HOOK_INPUT=$(cat)
    
    # Extract file_path using jq (handles both tool_input.file_path and file_path)
    EDITED_FILE=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // .file_path // empty')
    
    if [ -z "$EDITED_FILE" ]; then
        echo "Could not extract file path from hook input, running minimal checks..."
        echo "Running typecheck..."
        bun run type-check
    else
        echo "Running post-write checks on: $EDITED_FILE"
        
        # Get the file extension
        ext="${EDITED_FILE##*.}"
        
        # Only process TypeScript/JavaScript files
        if [[ "$ext" == "ts" || "$ext" == "tsx" || "$ext" == "js" || "$ext" == "jsx" ]]; then
            
            # Track if any checks fail
            FAILED_CHECKS=""
            
            # Run typecheck (always check whole project as types are interconnected)
            echo "Running typecheck..."
            if ! bun run type-check; then
                FAILED_CHECKS="${FAILED_CHECKS}typecheck "
            fi
            
            # Run linter on specific file
            echo "Running linter on $EDITED_FILE..."
            if ! bun run lint:fix "$EDITED_FILE"; then
                FAILED_CHECKS="${FAILED_CHECKS}lint "
            fi
            
            # Find and run related test files
            base_name="${EDITED_FILE%.*}"
            test_files=()
            
            # Check for corresponding test files
            for test_pattern in ".test.ts" ".test.tsx" ".spec.ts" ".spec.tsx" ".test.js" ".test.jsx" ".spec.js" ".spec.jsx"; do
                test_file="${base_name}${test_pattern}"
                if [ -f "$test_file" ]; then
                    test_files+=("$test_file")
                fi
            done
            
            # Also check if this IS a test file
            if [[ "$EDITED_FILE" == *".test."* || "$EDITED_FILE" == *".spec."* ]]; then
                test_files+=("$EDITED_FILE")
            fi
            
            # Run tests if any related test files found
            if [ ${#test_files[@]} -gt 0 ]; then
                echo "Running related tests..."
                if ! bun test "${test_files[@]}"; then
                    FAILED_CHECKS="${FAILED_CHECKS}tests "
                fi
            else
                echo "No related test files found for $EDITED_FILE"
            fi
            
            # Run formatter on specific file
            echo "Running formatter on $EDITED_FILE..."
            if ! bun run format "$EDITED_FILE"; then
                FAILED_CHECKS="${FAILED_CHECKS}format "
            fi
            
            # Report if any checks failed
            if [ -n "$FAILED_CHECKS" ]; then
                echo "❌ FAILED CHECKS: $FAILED_CHECKS" >&2
                exit 2
            fi
            
        elif [[ "$ext" == "json" || "$ext" == "md" || "$ext" == "yaml" || "$ext" == "yml" ]]; then
            # Just format these file types
            echo "Running formatter on $EDITED_FILE..."
            bun run format "$EDITED_FILE"
        else
            echo "Skipping checks for $EDITED_FILE (not a supported file type)"
        fi
    fi
fi

echo "Post-write checks completed successfully!"