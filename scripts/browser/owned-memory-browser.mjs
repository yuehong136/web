import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { randomInt, randomUUID } from 'node:crypto'
import {
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  mkdirSync,
  createWriteStream,
} from 'node:fs'
import { createConnection } from 'node:net'
import { resolve, dirname } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') return false
    throw error
  }
}
const listening = (port) =>
  new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', (error) => {
      socket.destroy()
      if (error.code === 'ECONNREFUSED') resolve(false)
      else reject(error)
    })
  })

/** Exact local resources are reserved durably before creation; never cleans borrowed services. */
export async function withOwnedMemoryBrowser(run) {
  assert.ok(process.env.MULTIRAG_RUN_ID, 'Use the registered validation runner')
  const cases = process.env.REST_DOCUMENT_RESOURCE_DIR
  assert.ok(cases)
  const journalPath = resolve(cases, `web-browser-${randomUUID()}.jsonl`)
  const fd = openSync(journalPath, 'wx', 0o600)
  fsyncSync(fd)
  const parent = openSync(cases, 'r')
  fsyncSync(parent)
  closeSync(parent)
  const event = (name, fields = {}) => {
    const bytes = Buffer.from(
      JSON.stringify({
        event: name,
        time: new Date().toISOString(),
        ...fields,
      }) + '\n',
    )
    let offset = 0
    while (offset < bytes.length) {
      const written = writeSync(fd, bytes, offset)
      assert.ok(written > 0, 'Journal short write')
      offset += written
    }
    fsyncSync(fd)
  }
  const output = resolve(
    'output/playwright/managed-memory',
    process.env.MULTIRAG_RUN_ID,
  )
  const serverPort = randomInt(40000, 49000)
  const browserPort = randomInt(50000, 59000)
  const baseURL = `http://127.0.0.1:${serverPort}`
  const browserBinary =
    process.env.MEMORY_BROWSER_BINARY ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : chromium.executablePath())
  const browserProfile = resolve(process.env.TMPDIR, `chrome-${randomUUID()}`)
  let server, browserProcess, browser, log, browserPid, browserPgid
  let rawError
  let failed = false
  event('reserve', {
    output,
    server: {
      host: '127.0.0.1',
      port: serverPort,
      command: 'memory-validation-server (Vite strictPort, owned cache)',
    },
    browser: {
      host: '127.0.0.1',
      port: browserPort,
      binary: browserBinary,
      profile: browserProfile,
    },
    parentPid: process.pid,
  })
  try {
    assert.equal(
      await listening(serverPort),
      false,
      'Reserved server port must be unused',
    )
    assert.equal(
      await listening(browserPort),
      false,
      'Reserved browser port must be unused',
    )
    mkdirSync(dirname(output), { recursive: true })
    mkdirSync(output, { recursive: false })
    mkdirSync(browserProfile, { recursive: false })
    log = createWriteStream(`${output}/server.log`, { flags: 'wx' })
    server = spawn(
      process.execPath,
      ['scripts/browser/memory-validation-server.mjs', String(serverPort)],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let serverError
    server.on('error', (error) => {
      serverError = error
      event('server-error', { error: String(error) })
    })
    event('server-created', { pid: server.pid, port: serverPort })
    server.stdout.pipe(log)
    server.stderr.pipe(log)
    let ready = false
    for (let n = 0; n < 100; n++) {
      assert.equal(server.exitCode, null, 'Owned Vite must remain alive')
      if (serverError) throw serverError
      try {
        ready = (await fetch(baseURL, { signal: AbortSignal.timeout(1000) })).ok
      } catch {}
      if (ready) break
      await delay(100)
    }
    assert.ok(ready, 'Owned Vite must become ready')
    browserProcess = spawn(
      browserBinary,
      [
        '--headless=new',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-extensions',
        `--remote-debugging-port=${browserPort}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${browserProfile}`,
        'about:blank',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let browserError
    browserProcess.on('error', (error) => {
      browserError = error
      event('browser-error', { error: String(error) })
    })
    browserPid = browserProcess.pid
    assert.ok(
      Number.isInteger(browserPid),
      'Chrome spawn must return an owned PID',
    )
    browserPgid = Number(
      execFileSync('/bin/ps', ['-o', 'pgid=', '-p', String(browserPid)], {
        encoding: 'utf8',
      }).trim(),
    )
    browserProcess.stdout.pipe(log)
    browserProcess.stderr.pipe(log)
    event('browser-created', {
      pid: browserPid,
      pgid: browserPgid,
      port: browserPort,
    })
    let cdpReady = false
    for (let n = 0; n < 100; n++) {
      assert.equal(
        browserProcess.exitCode,
        null,
        'Owned Chrome must remain alive',
      )
      if (browserError) throw browserError
      try {
        cdpReady = (
          await fetch(`http://127.0.0.1:${browserPort}/json/version`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      } catch {}
      if (cdpReady) break
      await delay(100)
    }
    assert.ok(cdpReady, 'Owned Chrome CDP must become ready')
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${browserPort}`)
    await run({ browser, baseURL, output, event })
    event('business-result', { passed: true })
  } catch (error) {
    failed = true
    rawError = error
    event('business-result', { passed: false, error: String(error) })
  } finally {
    const cleanupErrors = []
    try {
      await browser?.close()
    } catch (error) {
      cleanupErrors.push(String(error))
    }
    // Both children inherit the registered process group; cancellation cannot orphan a detached browser.
    if (browserPid && alive(browserPid)) browserProcess.kill('SIGTERM')
    if (server?.exitCode === null) server.kill('SIGTERM')
    for (
      let n = 0;
      n < 100 &&
      ((server?.pid && alive(server.pid)) || (browserPid && alive(browserPid)));
      n++
    )
      await delay(50)
    const state = {
      serverPid: server?.pid,
      browserPid,
      browserPgid,
      serverAlive: server?.pid ? alive(server.pid) : false,
      browserAlive: browserPid ? alive(browserPid) : false,
      serverListening: await listening(serverPort),
      browserListening: await listening(browserPort),
      errors: cleanupErrors,
    }
    event('cleanup-readback', state)
    log?.end()
    closeSync(fd)
    assert.equal(state.serverAlive, false)
    assert.equal(state.browserAlive, false)
    assert.equal(state.serverListening, false)
    assert.equal(state.browserListening, false)
    assert.deepEqual(cleanupErrors, [])
  }
  if (failed) throw rawError
}
