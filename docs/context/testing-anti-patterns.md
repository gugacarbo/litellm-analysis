# Process: super-planning

> Test guidance installed by `$super-planning` Phase 2. Source template:
> `/home/gustavo/.agents/skills/super-planning/templates/testing-anti-patterns.md`.

# Testing anti-patterns

Use this guide when designing or reviewing tests, especially when adding mocks,
stubs, spies, fakes, fixtures, or test-only helpers.

## Test behavior, not mock behavior

Assert the result or observable interaction required by the user. A call-count
assertion is useful only when the interaction itself is part of the contract.

## Do not add production APIs only for tests

Avoid public methods, flags, or branches that exist solely to make a test
easier. Prefer dependency injection, a narrow adapter, or a real public
behavior.

## Mock only genuine boundaries

Do not mock the function under test or internal collaborators merely for
convenience. Mock external systems, nondeterministic services, or expensive
boundaries when integration coverage exists elsewhere.

## Know the substitute you are using

- **Mock:** a substitute that can also verify expected interactions.
- **Stub:** a substitute that returns controlled responses.
- **Spy:** an observer of calls that may wrap the original behavior.
- **Fake:** a simplified but functional implementation of a dependency.

Choose the smallest substitute that preserves the contract being tested. Unit
and integration tests can coexist: isolate deterministic logic in unit tests
and verify real boundaries in integration tests.

## Keep fixtures honest

Use the smallest realistic data that exercises the behavior. Avoid fixtures
that bypass validation, hide missing fields, or encode implementation details
unnecessarily.

## Prefer deterministic tests

Control time, randomness, network access, and process state explicitly. A
flaky test is not evidence of behavior; isolate the source of nondeterminism
before relying on its result.
