
export type TestStatus = "passed" | "updated" | "skipped" | "errored" | "failed" | "missing"
export type TestResult = { status: TestStatus }
