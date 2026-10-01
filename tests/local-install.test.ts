import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { release, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify, stripVTControlCharacters } from "node:util";
import { spawn as spawnPty } from "@lydell/node-pty";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const question = {
  questions: [{
    question: "Which color should we use?",
    header: "Color",
    options: [
      { label: "Blue", description: "Use blue" },
      { label: "Green", description: "Use green" },
    ],
  }],
};

// The model endpoint is the external fixture. Pi, npm, the extension, schema
// validation, config, deferred imports, rendering, and keyboard input are real.
test("prepared local outer root completes an English questionnaire through Pi 0.99.1", { timeout: 180_000 }, async (t) => {
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const scratch = await realpath(await mkdtemp(join(tmpdir(), "pi-local-smoke-")));
  t.diagnostic(`Isolated environment and diagnostics: ${scratch}`);
  const prepared = join(scratch, "outer root");
  const agent = join(scratch, "agent");
  const workspace = join(scratch, "workspace");
  const host = join(scratch, "host");
  const home = join(scratch, "home");
  await Promise.all([prepared, agent, workspace, host, home].map((path) => mkdir(path, { recursive: true })));
  await cp(root, prepared, {
    recursive: true,
    filter: (path) => ![".git", "node_modules"].includes(basename(path)) && !path.endsWith(".tgz"),
  });
  const npmrc = join(scratch, "npmrc");
  await writeFile(npmrc, "registry=https://registry.npmjs.org/\n");
  const globalNpmrc = join(scratch, "global-npmrc");
  await writeFile(globalNpmrc, "");
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
    HOME: home,
    TMPDIR: scratch,
    TERM: "xterm-256color",
    PI_CODING_AGENT_DIR: agent,
    PI_OFFLINE: "1",
    PI_TELEMETRY: "0",
    NPM_CONFIG_USERCONFIG: npmrc,
    NPM_CONFIG_GLOBALCONFIG: globalNpmrc,
    NPM_CONFIG_CACHE: join(scratch, "npm-cache"),
    NPM_CONFIG_IGNORE_SCRIPTS: "true",
    NPM_CONFIG_AUDIT: "false",
    NPM_CONFIG_FUND: "false",
  };
  const profile = join(scratch, "sandbox.sb");
  if (process.platform === "darwin") {
    const ancestors: string[] = [];
    for (let path = dirname(process.execPath); path !== "/"; path = dirname(path)) {
      ancestors.push(`(literal ${JSON.stringify(path)})`);
    }
    // Candidate processes cannot read the maintainer's home/configuration.
    await writeFile(profile, `(version 1)
(allow default)
(deny file-read* (subpath "/Users") (subpath "/Volumes"))
(deny file-write*)
(allow file-read-metadata ${ancestors.join(" ")})
(allow file-read*
  (subpath ${JSON.stringify(dirname(dirname(process.execPath)))})
  (subpath ${JSON.stringify(scratch)}))
(allow file-write* (subpath "/dev") (subpath ${JSON.stringify(scratch)}))
`);
  }
  function restricted(command: string, args: string[]) {
    return process.platform === "darwin"
      ? { command: "/usr/bin/sandbox-exec", args: ["-f", profile, command, ...args] }
      : { command, args };
  }
  async function execute(command: string, args: string[], cwd: string, log: string) {
    const invocation = restricted(command, args);
    try {
      const result = await run(invocation.command, invocation.args, { cwd, env, timeout: 90_000, maxBuffer: 8_000_000 });
      await writeFile(join(scratch, log), result.stdout + result.stderr);
      return result;
    } catch (error) {
      if (error && typeof error === "object" && "stdout" in error && "stderr" in error) {
        await writeFile(join(scratch, log), String(error.stdout) + String(error.stderr));
      }
      throw error;
    }
  }
  await execute("npm", ["ci", "--omit=dev", "--legacy-peer-deps", "--ignore-scripts"], prepared, "preparation.log");
  const config = JSON.parse(await readFile(join(prepared, "node_modules/@juicesharp/rpiv-config/package.json"), "utf8"));
  assert.equal(config.version, "2.11.0");
  await assert.rejects(readFile(join(prepared, "node_modules/@juicesharp/rpiv-i18n/package.json")), { code: "ENOENT" });
  await assert.rejects(readFile(join(prepared, "node_modules/@earendil-works/pi-coding-agent/package.json")), { code: "ENOENT" });
  await execute("npm", ["install", "--prefix", host, "--ignore-scripts", "@earendil-works/pi-coding-agent@0.99.1"], workspace, "host-installation.log");
  const hostManifest = JSON.parse(await readFile(join(host, "node_modules/@earendil-works/pi-coding-agent/package.json"), "utf8"));
  assert.equal(hostManifest.version, "0.99.1");
  await assert.rejects(readFile(join(host, "node_modules/@juicesharp/rpiv-i18n/package.json")), { code: "ENOENT" });
  const cli = join(host, "node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js");
  const installation = await execute(process.execPath, [cli, "install", prepared], workspace, "installation.log");
  const listing = await execute(process.execPath, [cli, "list"], workspace, "installed-sources.log");
  assert.ok(listing.stdout.includes(prepared), listing.stdout);
  const settings = JSON.parse(await readFile(join(agent, "settings.json"), "utf8"));
  assert.ok(settings.packages.some((source: string) => resolve(agent, source) === prepared));
  assert.deepEqual(JSON.parse(await readFile(join(prepared, "package.json"), "utf8")), manifest);

  let registered = false;
  let toolResult: string | undefined;
  let fixtureError: unknown;
  const server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.equal(request.url, "/v1/chat/completions");
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      registered = body.tools.some((tool: { function: { name: string } }) => tool.function.name === "ask_user_question");
      assert.ok(registered, "Pi must register and advertise the real questionnaire tool");
      const result = body.messages.find((message: { role: string }) => message.role === "tool");
      toolResult = result?.content;
      response.writeHead(200, { "content-type": "text/event-stream" });
      const delta = result
        ? { role: "assistant", content: "Questionnaire smoke complete." }
        : { role: "assistant", tool_calls: [{ index: 0, id: "questionnaire-smoke", type: "function", function: { name: "ask_user_question", arguments: JSON.stringify(question) } }] };
      const chunk = { id: "smoke", object: "chat.completion.chunk", created: 0, model: "questionnaire", choices: [{ index: 0, delta, finish_reason: null }] };
      response.write(`data: ${JSON.stringify(chunk)}\n\n`);
      response.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: result ? "stop" : "tool_calls" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}\n\n`);
      response.end("data: [DONE]\n\n");
    } catch (error) {
      fixtureError = error;
      response.writeHead(500).end(String(error));
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await writeFile(join(agent, "models.json"), JSON.stringify({
    providers: { smoke: {
      api: "openai-completions", baseUrl: `http://127.0.0.1:${address.port}/v1`, apiKey: "fixture-only",
      models: [{ id: "questionnaire", reasoning: false, input: ["text"], contextWindow: 16384, maxTokens: 1024 }],
    } },
  }));
  const args = [cli, "--provider", "smoke", "--model", "questionnaire", "--no-session", "--tools", "ask_user_question", "--no-skills", "--no-prompt-templates", "--no-themes", "--no-context-files", "--no-approve", "--verbose", "Ask the fixture question"];
  const invocation = restricted(process.execPath, args);
  const terminal = spawnPty(invocation.command, invocation.args, { cwd: workspace, env, name: "xterm-256color", cols: 120, rows: 40 });
  t.after(() => terminal.kill());
  let output = "";
  let exited = false;
  terminal.onExit(() => { exited = true; });
  terminal.onData((chunk) => { output += chunk; });
  async function waitFor(predicate: () => boolean, description: string) {
    const deadline = Date.now() + 30_000;
    while (!predicate()) {
      if (fixtureError) throw fixtureError;
      if (exited || Date.now() > deadline) {
        await writeFile(join(scratch, "resource-loading-and-runtime.log"), output);
        assert.fail(`${description}\n${stripVTControlCharacters(output).slice(-6000)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  await waitFor(() => stripVTControlCharacters(output).includes("Type something."), "English questionnaire must render after deferred imports");
  assert.ok(stripVTControlCharacters(output).includes("Which color should we use?"));
  terminal.write("\r");
  await waitFor(() => toolResult !== undefined, "Confirming Blue must send the answer back through Pi to the model");
  assert.ok(registered);
  assert.equal(toolResult, 'User has answered your questions: "Which color should we use?"="Blue". You can now continue with the user\'s answers in mind.');
  assert.doesNotMatch(toolResult!, /no_ui|no_custom_ui|session_load_failed|stale_module_cache/);
  await waitFor(() => stripVTControlCharacters(output).includes("Questionnaire smoke complete."), "Pi must complete the turn");
  const diagnostics = stripVTControlCharacters(output);
  assert.ok(diagnostics.includes(join(prepared, "upstream/rpiv-ask-user-question")), "Pi's loaded extension must belong to the prepared outer root");
  assert.doesNotMatch(diagnostics, /should be peerDependencies|Failed to load extension|Error loading extension|Cannot find (module|package)|ERR_MODULE_NOT_FOUND|session_load_failed|stale_module_cache/i);
  await writeFile(join(scratch, "resource-loading-and-runtime.log"), output);
  await writeFile(join(scratch, "tool-result.txt"), toolResult!);
  const npmVersion = await execute("npm", ["--version"], workspace, "npm-version.log");
  const dependencyTree = await execute("npm", ["ls", "@juicesharp/rpiv-config", "typebox", "--all", "--json"], prepared, "resolved-dependencies.json");
  const hostTree = await execute("npm", ["ls", "@earendil-works/pi-coding-agent", "@earendil-works/pi-tui", "typebox", "--all", "--json"], host, "resolved-host-dependencies.json");
  const report = {
    recordedAt: new Date().toISOString(),
    source: "prepared local outer root", prepared, installedName: manifest.name, installedVersion: manifest.version,
    extensionPath: join(prepared, "upstream/rpiv-ask-user-question/index.ts"), configuredSources: settings.packages,
    upstreamSnapshot: manifest.upstreamSnapshot, node: process.version, npm: npmVersion.stdout.trim(), pi: hostManifest.version, platform: process.platform, osRelease: release(),
    architecture: process.arch, config: config.version, i18n: "absent", registered,
    installationDiagnostics: installation.stdout + installation.stderr,
    resourceLoadingDiagnostics: "No relevant host warning, import, or factory error",
    toolResult, sandbox: process.platform === "darwin" ? "macOS Seatbelt; isolated environment, home, npm config/cache, Pi state, workspace, and dependencies" : "isolated environment, home, npm config/cache, Pi state, workspace, and dependencies",
    resolvedDependencies: JSON.parse(dependencyTree.stdout), resolvedHostDependencies: JSON.parse(hostTree.stdout),
    diagnosticsDirectory: scratch,
  };
  await writeFile(join(scratch, "report.json"), JSON.stringify(report, null, 2) + "\n");
  if (process.env.PI_SMOKE_REPORT) await writeFile(process.env.PI_SMOKE_REPORT, JSON.stringify(report, null, 2) + "\n");
});
