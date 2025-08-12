# Tasks Documentation

This directory contains implementation-focused task documentation that provides step-by-step guidance for developers working on specific features or fixes.

## Purpose

Tasks documentation serves to:

- Break down complex work into manageable phases
- Provide clear Definition of Done (DoD) for each phase
- Guide developers through implementation with specific file references
- Ensure consistent approaches across team members
- Capture research and learning resources

## Directory Structure

- **`todo/`** - Tasks that are planned but not yet started
- **`in-progress/`** - Tasks currently being worked on
- **`done/`** - Completed tasks (kept for reference and knowledge sharing)

## Task Lifecycle

1. **Created** in `todo/` with research and planning
2. **Moved** to `in-progress/` when work begins
3. **Moved** to `done/` when all phases are complete and DoD is met

## What Belongs Here

- **Feature Implementation**: Step-by-step guides for new features
- **Bug Fix Procedures**: Systematic approaches to resolving issues
- **Refactoring Tasks**: Planned code improvements with clear phases
- **Integration Work**: Adding new services or external systems
- **Performance Optimizations**: Specific improvements with measurable goals

## Task Naming Convention

Tasks should use descriptive names with optional priority prefixes:

- `P1-implement-user-authentication.md` (High priority)
- `P2-add-rate-limiting.md` (Medium priority)
- `P3-optimize-database-queries.md` (Low priority)
- `refactor-error-handling.md` (No specific priority)

## Template

Use the template below for new tasks:

```markdown
# Task: [TITLE]

## Overview

Brief description of what needs to be accomplished and why.

## Prerequisites

- Required knowledge or skills
- Dependencies that must be completed first
- Tools or access needed

## Research Phase

### Background Reading

- [ ] Document/resource 1
- [ ] Document/resource 2
- [ ] External documentation/tutorials

### Investigation Tasks

- [ ] Analyze current implementation in [specific files]
- [ ] Research best practices for [specific area]
- [ ] Evaluate alternatives and trade-offs

### Research DoD

- [ ] Understanding of current state documented
- [ ] Approach decided and documented
- [ ] Potential risks identified

## Implementation Phases

### Phase 1: [Phase Name]

**Objective**: Specific goal of this phase

**Files to Modify**:

- `src/path/to/file1.ts` - What changes are needed
- `tests/path/to/test1.test.ts` - What tests to add/modify
- `docs/path/to/doc.md` - Documentation updates

**Tasks**:

- [ ] Specific task 1
- [ ] Specific task 2
- [ ] Update related documentation

**DoD**:

- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Specific verification step

### Phase 2: [Phase Name]

**Objective**: Specific goal of this phase

**Files to Modify**:

- `src/path/to/file2.ts` - What changes are needed

**Tasks**:

- [ ] Specific task 1
- [ ] Specific task 2

**DoD**:

- [ ] Measurable outcome 1
- [ ] Measurable outcome 2

## Testing Strategy

How will this implementation be verified?

- Unit tests: Which components need testing
- Integration tests: Which workflows need verification
- Manual testing: What scenarios to verify

## Rollback Plan

How to undo changes if issues arise:

1. Step 1
2. Step 2

## Notes

Any additional context, gotchas, or lessons learned during implementation.

## References

- Related ADRs
- External documentation
- Similar implementations
```

## Phase Guidelines

Each phase should:

- Have a clear, measurable objective
- Be completable in 1-4 hours of focused work
- Have specific file references where work will occur
- Include verifiable Definition of Done criteria
- Be independent enough to be reviewed separately

## Definition of Done (DoD) Examples

Good DoD criteria are:

- ✅ "All unit tests pass with >90% coverage"
- ✅ "API returns 200 status for valid requests"
- ✅ "Performance improves by 20% as measured by benchmark"
- ❌ "Code looks good" (too subjective)
- ❌ "Feature works" (not specific enough)

## Examples

- `implement-jwt-authentication.md` - User authentication system
- `add-database-connection-pooling.md` - Performance optimization
- `refactor-error-handling-middleware.md` - Code improvement task
