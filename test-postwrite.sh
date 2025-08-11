#!/bin/bash

# Comprehensive test suite for .claude/postwrite.sh
# Tests functionality, edge cases, and security vulnerabilities

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
POSTWRITE_SCRIPT="$PROJECT_DIR/.claude/postwrite.sh"
TEST_RESULTS=""
PASSED_TESTS=0
FAILED_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test helper functions
log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TEST_RESULTS="${TEST_RESULTS}FAILED: $1\n"
    ((FAILED_TESTS++))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment..."
    
    # Create temporary test files
    mkdir -p "$PROJECT_DIR/test-temp"
    
    # Create test TypeScript file
    cat > "$PROJECT_DIR/test-temp/test-file.ts" << 'EOF'
export const testFunction = (x: number): number => {
    return x * 2;
};
EOF

    # Create test JSON file
    cat > "$PROJECT_DIR/test-temp/test-config.json" << 'EOF'
{
    "name": "test",
    "version": "1.0.0"
}
EOF

    # Create test markdown file
    cat > "$PROJECT_DIR/test-temp/test-doc.md" << 'EOF'
# Test Document
This is a test markdown file.
EOF

    # Create corresponding test file
    cat > "$PROJECT_DIR/test-temp/test-file.test.ts" << 'EOF'
import { testFunction } from './test-file';

test('testFunction should double input', () => {
    expect(testFunction(5)).toBe(10);
});
EOF
}

# Cleanup test environment
cleanup_test_env() {
    log_info "Cleaning up test environment..."
    rm -rf "$PROJECT_DIR/test-temp"
}

# Test 1: Basic functionality with TypeScript file
test_basic_typescript() {
    log_test "Basic TypeScript file processing"
    
    local input='{"tool_input": {"file_path": "./test-temp/test-file.ts"}}'
    local output
    local exit_code
    
    cd "$PROJECT_DIR"
    output=$(echo "$input" | timeout 30 bash "$POSTWRITE_SCRIPT" 2>&1) || exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        if [[ "$output" == *"Running post-write checks on: ./test-temp/test-file.ts"* ]]; then
            log_pass "TypeScript file processing works correctly"
        else
            log_fail "TypeScript file processing - unexpected output: $output"
        fi
    else
        log_fail "TypeScript file processing failed with exit code $exit_code: $output"
    fi
}

# Test 2: JSON input parsing variations
test_json_parsing() {
    log_test "JSON input parsing variations"
    
    # Test tool_input.file_path format
    local input1='{"tool_input": {"file_path": "./test-temp/test-file.ts"}}'
    local output1
    output1=$(echo "$input1" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$output1" == *"Running post-write checks on: ./test-temp/test-file.ts"* ]]; then
        log_pass "JSON parsing - tool_input.file_path format"
    else
        log_fail "JSON parsing - tool_input.file_path format failed"
    fi
    
    # Test direct file_path format
    local input2='{"file_path": "./test-temp/test-file.ts"}'
    local output2
    output2=$(echo "$input2" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$output2" == *"Running post-write checks on: ./test-temp/test-file.ts"* ]]; then
        log_pass "JSON parsing - direct file_path format"
    else
        log_fail "JSON parsing - direct file_path format failed"
    fi
}

# Test 3: File type detection
test_file_type_detection() {
    log_test "File type detection and routing"
    
    # Test JSON file
    local json_input='{"file_path": "./test-temp/test-config.json"}'
    local json_output
    json_output=$(echo "$json_input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$json_output" == *"Running formatter on ./test-temp/test-config.json"* ]]; then
        log_pass "File type detection - JSON file routing"
    else
        log_fail "File type detection - JSON file routing failed: $json_output"
    fi
    
    # Test Markdown file
    local md_input='{"file_path": "./test-temp/test-doc.md"}'
    local md_output
    md_output=$(echo "$md_input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$md_output" == *"Running formatter on ./test-temp/test-doc.md"* ]]; then
        log_pass "File type detection - Markdown file routing"
    else
        log_fail "File type detection - Markdown file routing failed: $md_output"
    fi
}

# Test 4: No stdin input (terminal mode)
test_no_stdin() {
    log_test "No stdin input handling"
    
    local output
    output=$(timeout 10 bash "$POSTWRITE_SCRIPT" < /dev/null 2>&1) || true
    
    if [[ "$output" == *"Running minimal post-write checks"* ]]; then
        log_pass "No stdin input - fallback to minimal checks"
    else
        log_fail "No stdin input - failed to handle terminal mode: $output"
    fi
}

# Test 5: Malformed JSON input
test_malformed_json() {
    log_test "Malformed JSON input handling"
    
    local malformed_inputs=(
        '{"invalid": json}'
        '{"file_path": missing_quotes}'
        '{incomplete'
        'not json at all'
        '{"file_path": null}'
    )
    
    for input in "${malformed_inputs[@]}"; do
        local output
        output=$(echo "$input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
        
        if [[ "$output" == *"Could not extract file path from hook input"* ]] || 
           [[ "$output" == *"Running minimal post-write checks"* ]]; then
            log_pass "Malformed JSON handling - graceful fallback for: $input"
        else
            log_fail "Malformed JSON handling - failed for: $input (output: $output)"
        fi
    done
}

# Test 6: Missing file paths
test_missing_files() {
    log_test "Missing file handling"
    
    local input='{"file_path": "./nonexistent/file.ts"}'
    local output
    local exit_code
    
    output=$(echo "$input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || exit_code=$?
    
    # Should attempt to process but handle missing file gracefully
    if [[ "$output" == *"./nonexistent/file.ts"* ]]; then
        log_pass "Missing file handling - attempts processing"
    else
        log_fail "Missing file handling - unexpected behavior: $output"
    fi
}

# Test 7: Special characters in file paths
test_special_characters() {
    log_test "Special characters in file paths"
    
    # Create file with spaces and special chars
    mkdir -p "$PROJECT_DIR/test-temp/special dir"
    cat > "$PROJECT_DIR/test-temp/special dir/file with spaces.ts" << 'EOF'
export const test = 1;
EOF
    
    local input='{"file_path": "./test-temp/special dir/file with spaces.ts"}'
    local output
    output=$(echo "$input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$output" == *"file with spaces.ts"* ]]; then
        log_pass "Special characters - handles spaces in filenames"
    else
        log_fail "Special characters - failed to handle spaces: $output"
    fi
    
    rm -rf "$PROJECT_DIR/test-temp/special dir"
}

# Test 8: Security - Path traversal attempts
test_security_path_traversal() {
    log_test "Security - Path traversal protection"
    
    local malicious_inputs=(
        '{"file_path": "../../../etc/passwd"}'
        '{"file_path": "../../../../home/user/.ssh/id_rsa"}'
        '{"file_path": "./test-temp/../../../etc/hosts"}'
    )
    
    for input in "${malicious_inputs[@]}"; do
        local output
        output=$(echo "$input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
        
        # Should process the path as given, but won't find files outside project
        if [[ "$output" != *"etc/passwd"* ]] && [[ "$output" != *"id_rsa"* ]]; then
            log_pass "Security - path traversal handled for: $input"
        else
            log_fail "Security - potential path traversal vulnerability: $input"
        fi
    done
}

# Test 9: Security - Command injection attempts
test_security_command_injection() {
    log_test "Security - Command injection protection"
    
    local malicious_inputs=(
        '{"file_path": "./test.ts; rm -rf /"}'
        '{"file_path": "./test.ts && echo malicious"}'
        '{"file_path": "./test.ts | cat /etc/passwd"}'
        '{"file_path": "$(whoami).ts"}'
        '{"file_path": "`id`.ts"}'
    )
    
    for input in "${malicious_inputs[@]}"; do
        local output
        output=$(echo "$input" | timeout 10 bash "$POSTWRITE_SCRIPT" 2>&1) || true
        
        # Should not execute the malicious commands
        if [[ "$output" != *"malicious"* ]] && [[ "$output" != *"root:"* ]]; then
            log_pass "Security - command injection prevented for: $input"
        else
            log_fail "Security - potential command injection vulnerability: $input"
        fi
    done
}

# Test 10: Test file detection and execution
test_test_file_detection() {
    log_test "Test file detection and execution"
    
    # Test with main file that has corresponding test
    local input='{"file_path": "./test-temp/test-file.ts"}'
    local output
    output=$(echo "$input" | timeout 20 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$output" == *"Running related tests"* ]]; then
        log_pass "Test file detection - finds related tests"
    else
        log_fail "Test file detection - failed to find related tests: $output"
    fi
    
    # Test with actual test file
    local test_input='{"file_path": "./test-temp/test-file.test.ts"}'
    local test_output
    test_output=$(echo "$test_input" | timeout 20 bash "$POSTWRITE_SCRIPT" 2>&1) || true
    
    if [[ "$test_output" == *"Running related tests"* ]]; then
        log_pass "Test file detection - processes test files"
    else
        log_fail "Test file detection - failed to process test file: $test_output"
    fi
}

# Test 11: Error handling and exit codes
test_error_handling() {
    log_test "Error handling and exit codes"
    
    # Create a file with syntax errors
    cat > "$PROJECT_DIR/test-temp/syntax-error.ts" << 'EOF'
export const broken = (x: number: string => {
    return x * "invalid";
};
EOF

    local input='{"file_path": "./test-temp/syntax-error.ts"}'
    local output
    local exit_code=0
    
    output=$(echo "$input" | timeout 15 bash "$POSTWRITE_SCRIPT" 2>&1) || exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log_pass "Error handling - exits with error code for failures"
    else
        log_fail "Error handling - should exit with error code for syntax errors"
    fi
    
    if [[ "$output" == *"FAILED CHECKS:"* ]]; then
        log_pass "Error handling - reports failed checks"
    else
        log_fail "Error handling - should report failed checks: $output"
    fi
}

# Test 12: Performance and timeout handling
test_performance() {
    log_test "Performance and timeout handling"
    
    local input='{"file_path": "./test-temp/test-file.ts"}'
    local start_time
    local end_time
    
    start_time=$(date +%s)
    echo "$input" | timeout 30 bash "$POSTWRITE_SCRIPT" > /dev/null 2>&1 || true
    end_time=$(date +%s)
    
    local duration=$((end_time - start_time))
    
    if [[ $duration -lt 25 ]]; then
        log_pass "Performance - completes within reasonable time ($duration seconds)"
    else
        log_fail "Performance - takes too long to complete ($duration seconds)"
    fi
}

# Run all tests
run_all_tests() {
    echo "========================================="
    echo "   POSTWRITE SCRIPT TEST SUITE"
    echo "========================================="
    echo
    
    # Check if postwrite script exists
    if [[ ! -f "$POSTWRITE_SCRIPT" ]]; then
        log_fail "Postwrite script not found at $POSTWRITE_SCRIPT"
        return 1
    fi
    
    # Check if script is executable
    if [[ ! -x "$POSTWRITE_SCRIPT" ]]; then
        log_info "Making postwrite script executable..."
        chmod +x "$POSTWRITE_SCRIPT"
    fi
    
    setup_test_env
    
    # Run all test functions
    test_basic_typescript
    test_json_parsing
    test_file_type_detection
    test_no_stdin
    test_malformed_json
    test_missing_files
    test_special_characters
    test_security_path_traversal
    test_security_command_injection
    test_test_file_detection
    test_error_handling
    test_performance
    
    cleanup_test_env
    
    echo
    echo "========================================="
    echo "           TEST SUMMARY"
    echo "========================================="
    echo -e "${GREEN}PASSED: $PASSED_TESTS${NC}"
    echo -e "${RED}FAILED: $FAILED_TESTS${NC}"
    echo
    
    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo -e "${RED}FAILED TESTS:${NC}"
        echo -e "$TEST_RESULTS"
        return 1
    else
        echo -e "${GREEN}ALL TESTS PASSED!${NC}"
        return 0
    fi
}

# Run the test suite
run_all_tests