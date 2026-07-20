import { expect, test } from '@playwright/test'
import { readPagefindEntry } from '../helpers'

// The positive half of the forceLanguage pair in tests/options/. Without
// this, the negative assertion there would pass just as well if the fixture
// site were entirely English and forceLanguage had never run at all.
test('language is auto-detected per page when forceLanguage is unset', async () => {
	// project.name only locates which variant's prebuilt output to read — a
	// no-options spec runs on two variants, so it has no single build dir to
	// hardcode. The assertion itself is identical for both variants, so this
	// is not the per-variant branching the "no branching on project name"
	// rule forbids.
	const entry = await readPagefindEntry(test.info().project.name)

	const languages = Object.keys(entry.languages)
	expect(languages.length).toBeGreaterThan(1)
	expect(languages).toContain('ja')
})
