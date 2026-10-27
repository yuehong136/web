import assert from 'node:assert/strict'

async function preferenceMenu(page) {
  const account = page.getByRole('button', {
    name: /Account menu for Fixture|Fixture 的账户菜单/,
  })
  if (!(await account.isVisible())) {
    await page.getByRole('button', { name: /Open navigation|打开导航/ }).click()
  }
  await page
    .getByRole('button', {
      name: /Account menu for Fixture|Fixture 的账户菜单/,
    })
    .click()
  await page
    .getByRole('menuitem', {
      name: /Appearance and language|外观与语言/,
      exact: true,
    })
    .click()
}

async function locale(page, value) {
  await preferenceMenu(page)
  await page
    .getByRole('menuitemradio', {
      name: value === 'en-US' ? 'English' : '简体中文',
      exact: true,
    })
    .click()
  await page.waitForFunction(
    (value) => document.documentElement.lang === value,
    value,
  )
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function colorMode(page, value) {
  await preferenceMenu(page)
  await page
    .getByRole('menuitemradio', {
      name: value === 'dark' ? /^(Dark|深色)$/ : /^(Light|浅色)$/,
    })
    .click()
  await page.waitForFunction(
    (value) => document.documentElement.dataset.theme === value,
    value,
  )
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function selectFixtureApp(page) {
  await page
    .getByRole('button', { name: 'Select skills or apps', exact: true })
    .click()
  await page.getByRole('button', { name: 'Apps', exact: true }).click()
  await page
    .getByRole('button', { name: /^Research assistant(?:\s|$)/ })
    .first()
    .click()
}

async function verifyHomeResources(page, { output, state, checks }) {
  const card = (filename) =>
    page.locator('[data-artifact-card]').filter({ hasText: filename }).first()
  const report = card('report.html')
  const reportId = await report.getAttribute('data-artifact-card')
  assert.match(await report.getAttribute('data-artifact-message-id'), /\S+/)
  await report.click()
  await page.locator('[data-workspace-detail] [data-artifact-panel]').waitFor()
  const iframe = page.locator('[data-artifact-panel] iframe')
  await page
    .frameLocator('[data-artifact-panel] iframe')
    .getByRole('heading', { name: 'Research artifact' })
    .waitFor()
  assert.equal(await iframe.getAttribute('sandbox'), '')
  const html = await iframe.getAttribute('srcdoc')
  assert.match(html, /default-src 'none'/)
  assert.doesNotMatch(html, /<script|UNSAFE_FIXTURE/)
  assert.equal(
    await page.evaluate(() => window.__workspaceFixtureEvidence.unsafeMessages),
    0,
  )
  const requests = state.artifacts
  const input = page.locator('[data-workspace-main] textarea').first()
  await input.fill('Draft while a report stays open')
  const inputNode = await input.elementHandle()
  const reportFrame = await iframe.elementHandle()
  const reportBody = page
    .frameLocator('[data-artifact-panel] iframe')
    .locator('body')
  await reportBody.evaluate((node) =>
    node.ownerDocument.defaultView.scrollTo(0, 100),
  )
  const reportScroll = await reportBody.evaluate(
    (node) => node.ownerDocument.defaultView.scrollY,
  )
  assert.ok(reportScroll > 0)
  const typeScript = page
    .locator('.code-block')
    .filter({ hasText: 'const answer: number = 42' })
    .first()
  const python = page
    .locator('.code-block')
    .filter({ hasText: 'def summarize(value: int)' })
    .first()
  await typeScript
    .locator('pre code span[style]')
    .first()
    .waitFor({ timeout: 30000 })
  await python
    .locator('pre code span[style]')
    .first()
    .waitFor({ timeout: 30000 })
  const originalCode = await typeScript.locator('pre code').innerText()
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  })
  await typeScript.getByRole('button', { name: 'Copy', exact: true }).click()
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    originalCode,
  )
  await colorMode(page, 'light')
  assert.equal(await typeScript.getAttribute('data-code-mode'), 'light')
  assert.equal(await typeScript.locator('pre code').innerText(), originalCode)
  await page.screenshot({ path: `${output}/home-artifact-light-en.png` })
  await locale(page, 'zh-CN')
  await locale(page, 'en-US')
  await colorMode(page, 'dark')
  assert.equal(
    state.artifacts,
    requests,
    'Locale/theme changes must not re-fetch the artifact',
  )
  assert.equal(await typeScript.locator('pre code').innerText(), originalCode)
  assert.equal(await typeScript.getAttribute('data-code-mode'), 'dark')
  assert.equal(await report.getAttribute('data-artifact-card'), reportId)
  assert.ok(await reportFrame.evaluate((node) => node.isConnected))
  assert.ok(await inputNode.evaluate((node) => node.isConnected))
  assert.equal(await input.inputValue(), 'Draft while a report stays open')
  const downloadEvent = page.waitForEvent('download')
  await page
    .locator('[data-artifact-panel]')
    .getByRole('button', { name: 'Download', exact: true })
    .click()
  const download = await downloadEvent
  assert.equal(download.suggestedFilename(), 'report.html')
  assert.equal(await download.failure(), null)
  assert.equal(
    state.artifacts,
    requests,
    'A loaded preview blob can serve a local download',
  )
  await page.screenshot({ path: `${output}/home-artifact-html-dark-en.png` })
  checks.push(
    'Home HTML artifact uses a scriptless CSP sandbox, stable message card, local download and no locale/theme re-fetch',
  )
  checks.push(
    'Real TypeScript/Python CodeBlock token spans and clipboard contents survive theme and language changes',
  )

  await page
    .getByRole('button', { name: /Sources.*citation/i })
    .first()
    .click()
  await page
    .getByRole('button', { name: /原文证据/ })
    .first()
    .click()
  await page.getByRole('tab', { name: 'Evidence', exact: true }).waitFor()
  const sourceBody = page.locator(
    '[role="tabpanel"]:not([hidden]) [data-context-panel-body]',
  )
  const sourceNode = await sourceBody.elementHandle()
  await sourceBody.evaluate((node) => {
    node.scrollTop = 180
  })
  const sourceScroll = await sourceBody.evaluate((node) => node.scrollTop)
  assert.ok(sourceScroll > 0)
  await page.getByRole('tab', { name: 'Artifacts', exact: true }).click()
  assert.ok(await reportFrame.evaluate((node) => node.isConnected))
  assert.equal(
    await reportBody.evaluate((node) => node.ownerDocument.defaultView.scrollY),
    reportScroll,
  )
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click()
  assert.ok(await sourceNode.evaluate((node) => node.isConnected))
  assert.equal(
    await sourceBody.evaluate((node) => node.scrollTop),
    sourceScroll,
  )
  await page.getByRole('tab', { name: 'Artifacts', exact: true }).click()
  assert.equal(state.artifacts, requests)
  checks.push(
    'Evidence and artifact tabs preserve their selected resource and mounted preview while the draft stays editable',
  )

  const chart = card('chart.png')
  await chart.click()
  const image = page.locator('[data-artifact-panel] img')
  await image.waitFor()
  await image.evaluate((node) => node.decode())
  const imageUrl = await image.getAttribute('src')
  await page
    .getByRole('button', { name: 'Return to answer', exact: true })
    .click()
  await page.locator('[data-artifact-panel]').waitFor({ state: 'detached' })
  assert.ok(
    await page.evaluate(
      (url) => window.__workspaceFixtureEvidence.revokedUrls.includes(url),
      imageUrl,
    ),
  )
  assert.ok(await chart.evaluate((node) => node === document.activeElement))
  await chart.click()
  await page.locator('[data-artifact-panel] img').waitFor()
  const scopedImageUrl = await page
    .locator('[data-artifact-panel] img')
    .getAttribute('src')
  await selectFixtureApp(page)
  await page.locator('[data-artifact-panel]').waitFor({ state: 'detached' })
  assert.ok(
    await page.evaluate(
      (url) => window.__workspaceFixtureEvidence.revokedUrls.includes(url),
      scopedImageUrl,
    ),
  )
  checks.push(
    'Closing a raster preview revokes its blob URL and restores card focus; changing the conversation scope also releases it',
  )
}

async function verifyArtifactErrors(page, { baseURL, state, checks }) {
  // A separate generated answer keeps the scope-reset assertion independent.
  await page.goto(`${baseURL}/home`)
  await selectFixtureApp(page)
  const input = page.locator('textarea[aria-label]').first()
  await input.fill('Keep the answer when a file is unavailable')
  await input.press('Enter')
  await page.locator('[data-run-phase="completed"]').last().waitFor()
  const body = page.locator('[data-message-role="assistant"]').last()
  for (const [filename, message] of [
    ['denied.html', 'You do not have access to this artifact.'],
    ['missing.html', 'This artifact is unavailable.'],
    ['failed.html', 'Could not load this artifact.'],
  ]) {
    await page
      .locator('[data-artifact-card]')
      .filter({ hasText: filename })
      .first()
      .click()
    await page.locator('[data-artifact-panel] [role="alert"]').waitFor()
    assert.equal(
      await page.locator('[data-artifact-panel] [role="alert"]').innerText(),
      message,
    )
    assert.match(await body.innerText(), /Evidence-backed answer/)
    assert.doesNotMatch(
      await page.locator('body').innerText(),
      /PRIVATE_FIXTURE_BACKEND_ERROR/,
    )
  }
  await page
    .getByRole('button', { name: 'Return to answer', exact: true })
    .click()
  checks.push(
    'Artifact HTTP 403/404/500 display fixed notices and preserve the generated assistant answer',
  )
  assert.ok(state.artifactRequests['denied.html'] > 0)
}

async function network(page) {
  return page.evaluate(() => {
    const entries = performance
      .getEntriesByType('resource')
      .filter((entry) => /\.(?:js|css|woff2?)(?:\?|$)/.test(entry.name))
    return {
      files: entries.length,
      encodedBodyBytes: entries.reduce(
        (total, entry) => total + entry.encodedBodySize,
        0,
      ),
      transferBytes: entries.reduce(
        (total, entry) => total + entry.transferSize,
        0,
      ),
      paths: entries.map((entry) => new URL(entry.name).pathname),
    }
  })
}

export async function verifyWorkspacePaths(page, { baseURL, output, state }) {
  const checks = []
  const networks = {}
  await page.goto(`${baseURL}/home`)
  const welcomeInput = page.locator('textarea[aria-label]').first()
  await welcomeInput.fill('切换语言和外观后继续写的草稿')
  const welcomeNode = await welcomeInput.elementHandle()
  await locale(page, 'zh-CN')
  await locale(page, 'en-US')
  await colorMode(page, 'dark')
  assert.ok(
    await welcomeNode.evaluate(
      (node) =>
        node.isConnected &&
        node === document.querySelector('textarea[aria-label]'),
    ),
  )
  assert.equal(await welcomeInput.inputValue(), '切换语言和外观后继续写的草稿')
  checks.push('Home locale/theme retain the same draft input')
  networks.Home = await network(page)

  await page
    .getByRole('button', { name: 'Select skills or apps', exact: true })
    .click()
  await page.getByRole('button', { name: 'Apps', exact: true }).click()
  await page
    .getByRole('button', { name: /Research assistant/ })
    .first()
    .click()
  await page.locator('[data-context-stage="selected"] summary').click()
  assert.match(
    await page.locator('[data-context-stage="selected"]').innerText(),
    /Research library/,
  )
  assert.match(
    await page.locator('[data-context-stage="selected"]').innerText(),
    /Availability unknown/,
  )
  await page
    .getByRole('button', { name: 'Continue research', exact: true })
    .waitFor()
  await page
    .locator('textarea[aria-label]')
    .first()
    .fill('Compare the evidence')
  const composingInput = page.locator('textarea[aria-label]').first()
  const beforeComposition = state.completions
  await composingInput.evaluate((node) => {
    node.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true, data: '证据' }),
    )
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 229,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    )
  })
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  )
  assert.equal(state.completions, beforeComposition)
  await composingInput.evaluate((node) =>
    node.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, data: '证据' }),
    ),
  )
  await composingInput.press('Enter')
  await page.locator('[data-context-stage="submitted"]').first().waitFor()
  await page
    .locator('[data-message-role="assistant"] [data-run-phase="completed"]')
    .last()
    .waitFor()
  assert.equal(
    await page
      .locator('[data-message-role="assistant"]')
      .first()
      .getAttribute('data-run-phase'),
    null,
  )
  assert.equal(state.lastSubmission.conversation_id, 'fixture-conversation')
  assert.equal(state.lastSubmission.contextManifest, undefined)
  assert.equal(state.lastSubmission.mcp_ids, undefined)
  const submittedCount = await page
    .locator('[data-context-stage="submitted"]')
    .count()
  assert.equal(submittedCount, 2)
  assert.equal(state.completions, beforeComposition + 1)
  checks.push(
    'Simulated composition Enter does not submit; compositionend then Enter submits once (physical IME not tested)',
  )
  checks.push(
    'Home app submission freezes a real scope without changing its API payload',
  )
  await page.screenshot({ path: `${output}/home-context-dark-en.png` })
  networks.HomeAnswer = await network(page)
  await verifyHomeResources(page, { output, state, checks })
  networks.HomeArtifacts = await network(page)
  await verifyArtifactErrors(page, { baseURL, state, checks })

  // Exercise the same source surface from Search, with a nonmodal wide dock.
  await page.goto(`${baseURL}/search/fixture-search`)
  await page.locator('textarea').first().fill('Find evidence')
  await page.locator('textarea').first().press('Enter')
  await page.getByRole('button', { name: /Sources.*citation/i }).click()
  const citation = page.getByRole('button', { name: /原文证据/ }).first()
  const origin = await citation.elementHandle()
  const input = page.locator('textarea').first()
  await input.fill('下一轮问题草稿')
  const inputNode = await input.elementHandle()
  await citation.click()
  await page.locator('[data-workspace-detail]').waitFor()
  assert.equal(await page.getByRole('dialog').count(), 0)
  await input.fill('证据区打开时仍可输入')
  assert.ok(
    await inputNode.evaluate(
      (node) =>
        node.isConnected &&
        node === document.querySelector('[data-workspace-main] textarea'),
    ),
  )
  await page.getByText('Technical details', { exact: true }).click()
  assert.match(await page.locator('[data-workspace-detail]').innerText(), /0%/)
  await page.screenshot({ path: `${output}/search-evidence-dark-en.png` })
  checks.push(
    'Wide evidence dock keeps the answer and composer interactive and preserves zero relevance',
  )
  networks.Search = await network(page)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  assert.ok(await origin.evaluate((node) => node === document.activeElement))

  const marker = page.getByRole('button', { name: /^Citation 1:/ }).first()
  const markerOrigin = await marker.elementHandle()
  await marker.click()
  await page.locator('[data-reference-details]').click()
  await page.locator('[data-workspace-detail]').waitFor()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  assert.ok(
    await markerOrigin.evaluate((node) => node === document.activeElement),
  )
  checks.push(
    'Inline citation marker opens its Details dock and receives focus after the dock closes',
  )

  await citation.click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Tab')
  assert.ok(
    await page
      .getByRole('dialog')
      .evaluate((node) => node.contains(document.activeElement)),
  )
  await page.screenshot({ path: `${output}/search-evidence-mobile-en.png` })
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  assert.ok(await origin.evaluate((node) => node === document.activeElement))
  assert.ok(await inputNode.evaluate((node) => node.isConnected))
  assert.equal(await input.inputValue(), '证据区打开时仍可输入')
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  checks.push(
    'Narrow evidence Sheet traps/restores focus without remounting the draft',
  )
  await locale(page, 'zh-CN')
  await page.screenshot({ path: `${output}/search-mobile-zh.png` })
  await locale(page, 'en-US')
  await page.setViewportSize({ width: 1920, height: 1080 })

  await citation.click()
  await page.setViewportSize({ width: 960, height: 540 })
  await page.evaluate(() => {
    document.documentElement.dataset.textScale = '1.25'
  })
  await page.getByRole('dialog').waitFor()
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  await page.screenshot({
    path: `${output}/search-half-viewport-text125-pressure.png`,
  })
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  await page.evaluate(() => {
    document.documentElement.dataset.textScale = '1'
  })
  await page.setViewportSize({ width: 1920, height: 1080 })
  checks.push(
    'Half-width CSS viewport (960px) plus 1.25 reading-scale pressure keeps the Sheet usable; actual browser zoom not measured',
  )

  // Explore without a completion event must preserve content and report interruption.
  state.end = 'interrupted'
  await page.goto(`${baseURL}/explore`)
  await page.locator('textarea').first().fill('Observe a truncated stream')
  await page.locator('textarea').first().press('Enter')
  await page.locator('[data-run-phase="interrupted"]').first().waitFor()
  assert.match(
    await page.locator('[data-workspace-main]').innerText(),
    /Evidence-backed answer/,
  )
  assert.equal(await page.locator('[data-run-phase="completed"]').count(), 0)
  await page.screenshot({ path: `${output}/explore-interrupted-en.png` })
  checks.push(
    'Explore EOF preserves content and is never presented as completed',
  )
  state.end = 'completed'
  for (const [ending, phase] of [
    ['completed', 'completed'],
    ['failed', 'failed'],
  ]) {
    state.end = ending
    await page.goto(`${baseURL}/explore`)
    await page
      .locator('textarea')
      .first()
      .fill(`Observe ${ending} terminal state`)
    await page.locator('textarea').first().press('Enter')
    await page
      .locator(`.message-parts[data-run-phase="${phase}"]`)
      .last()
      .waitFor()
    assert.match(
      await page.locator('[data-workspace-main]').innerText(),
      /Evidence-backed answer/,
    )
    if (phase === 'failed')
      assert.equal(
        await page
          .locator('.message-parts[data-run-phase="completed"]')
          .count(),
        0,
      )
  }
  state.end = 'completed'
  checks.push(
    'Explore explicit completion and error frames produce completed/failed outcomes while retaining the answer',
  )
  return { checks, networks, fixtureCompletions: state.completions }
}
