/* labctl console under the Homelab topology: plays the scenarios in _data/homelab_scenarios.yml through the
   pipeline on the diagram (packets via window.HLMap from homelab.js) and the L1-L5 trace. Simulation only:
   nothing is sent anywhere and no attack is executed. */
(function () {
  var root = document.getElementById('hl-sim');
  var src = document.getElementById('hl-sim-data');
  if (!root || !src) { return; }
  var data = JSON.parse(src.textContent || '{}');
  var scenarios = data.scenarios || [];
  var models = data.models || {};
  var byId = {};
  scenarios.forEach(function (s) { byId[s.id] = s; });

  var out = root.querySelector('.hl-term-out');
  var form = root.querySelector('.hl-term-form');
  var input = form.querySelector('input');
  var clock = root.querySelector('[data-sim="clock"]');
  var title = root.querySelector('[data-sim="title"]');
  var trace = [].slice.call(root.querySelectorAll('.hl-trace li[data-layer]'));
  var SEVERITIES = ['low', 'medium', 'high', 'critical'];
  var COMMANDS = ['help', 'scenarios', 'run', 'show', 'verdict', 'model', 'replay', 'stop', 'clear', 'history'];
  /* Attack tools people tend to type; the console points them at the matching scripted scenario. */
  var TOOLS = { nmap: 'recon-scan', masscan: 'recon-scan', hydra: 'ssh-bruteforce', medusa: 'ssh-bruteforce',
    ssh: 'ssh-bruteforce', sqlmap: 'web-sqli', curl: 'web-sqli', nikto: 'web-sqli' };

  var st = { model: Object.keys(models)[0] || 'llama3', run: 0, busy: false, last: null, lastModel: null, verdict: null, simTime: null };
  var history = [], hpos = 0;

  function map() { return window.HLMap; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function modelName(key) { return models[key || st.model] || key || st.model; }
  function fill(text, key) { return String(text).split('{model}').join(modelName(key)); }
  function hms(d) { return d.toISOString().slice(11, 19) + 'Z'; }

  function print(html, cls) {
    var p = document.createElement('p');
    if (cls) { p.className = cls; }
    p.innerHTML = html;
    out.appendChild(p);
    while (out.childNodes.length > 500) { out.removeChild(out.firstChild); }
    out.scrollTop = out.scrollHeight;
    return p;
  }
  function say(text, cls) { return print(esc(text), cls); }
  function json(text, key) {
    var body = fill(text, key);
    try { body = JSON.stringify(JSON.parse(body), null, 2); } catch (e) { body = body.trim(); }
    return say(body, 'json');
  }
  function table(rows) {
    print('<table>' + rows.map(function (r) {
      return '<tr>' + r.map(function (c, i) { return '<td' + (i ? '' : ' class="cmd-cell"') + '>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</table>');
  }

  function setTrace(layer, state) {
    trace.forEach(function (li) {
      if (Number(li.dataset.layer) !== layer) { return; }
      li.dataset.state = state;
      li.querySelector('em').textContent = { ok: 'passed', archive: 'archived', skip: 'skipped', warn: 'flagged', fail: 'failed', run: 'running', idle: 'idle' }[state] || state;
    });
  }
  function resetTrace(text) {
    trace.forEach(function (li) { setTrace(Number(li.dataset.layer), 'idle'); });
    title.textContent = text;
  }

  setInterval(function () { if (!st.busy) { clock.textContent = hms(new Date()); } }, 1000);

  /* --- commands --- */

  function help() {
    table([
      ['scenarios', 'list the attack scenarios'],
      ['run <id> [--model m]', 'play one scenario through the pipeline'],
      ['show raw|normalized|llm|record', 'data from the last run'],
      ['verdict accept', 'analyst accepts the last recommendation'],
      ['verdict correct <severity>', 'analyst corrects it (low|medium|high|critical)'],
      ['model [' + Object.keys(models).join('|') + ']', 'show or pick the LLM'],
      ['replay <id>', 'same recorded alerts to every model, as in the evaluation'],
      ['stop', 'stop the running scenario (Ctrl+C)'],
      ['clear', 'clear the screen (Ctrl+L)']
    ]);
    say('Tab completes commands and scenario ids; ↑ and ↓ walk the history.', 'dim');
  }

  function list() {
    table([['ID', 'TYPE', 'TECHNIQUE', 'EXPECTED LABEL']].concat(scenarios.map(function (s) {
      return [s.id, s.kind, s.mitre, s.expect];
    })));
    say('run one with: run <id>', 'dim');
  }

  function run(id, key) {
    var s = byId[id];
    if (!s) { say('run: unknown scenario "' + (id || '') + '". type scenarios for the list.', 'fail'); return; }
    if (st.busy) { say('a scenario is already running; stop it first.', 'warn'); return; }
    key = key || st.model;
    var me = ++st.run;
    st.busy = true;
    st.verdict = null;
    if (map()) { map().clear(); }
    resetTrace(s.name + ' · ' + s.mitre);
    print('<span class="dim">── ' + esc(s.name) + ' · ' + esc(s.mitre) + ' · model ' + esc(modelName(key)) + '</span>');
    say(s.summary, 'dim');
    var base = new Date();
    var steps = s.steps || [];
    var at = null;
    var i = 0;

    function next() {
      if (me !== st.run) { return; }
      if (i >= steps.length) { finish(); return; }
      var step = steps[i++];
      var tone = step.level === 'critical' ? 'critical' : step.level === 'high' ? 'high' : '';
      var go;
      if (step.hop && map()) {
        if (at) { map().busy(at, false); }
        map().busy(step.hop[0], true);
        go = map().travel(step.hop[0], step.hop[1], step.hop[1] === 'n8n' && step.hop[0] === 'ollama' ? 900 : 650, tone).then(function () {
          map().busy(step.hop[0], false);
          map().busy(step.hop[1], true);
          map().inspect(step.hop[1]);
          at = step.hop[1];
        });
      } else {
        go = wait(step.hop ? 500 : 320);
      }
      go.then(function () {
        if (me !== st.run) { return; }
        var t = new Date(base.getTime() + (step.t || 0) * 1000);
        clock.textContent = hms(t);
        print('<span class="t">' + hms(t) + '</span> <span class="s">' + esc(step.src || '') + '</span> <span class="' + esc(step.level || '') + '">' + esc(fill(step.text, key)) + '</span>');
        if (step.layer) { setTrace(step.layer, step.state || 'ok'); }
        next();
      });
    }

    function finish() {
      st.busy = false;
      st.last = s;
      st.lastModel = key;
      var last = steps.length ? steps[steps.length - 1].t || 0 : 0;
      say('done · ' + last + ' s on the simulated clock · ' + Object.keys(s.show || {}).map(function (k) { return 'show ' + k; }).join(', '), 'dim');
      setTimeout(function () { if (me === st.run && map()) { map().clear(); } }, 1600);
    }

    next();
  }

  function stop(quiet) {
    if (!st.busy) { if (!quiet) { say('nothing is running.', 'dim'); } return; }
    st.run++;
    st.busy = false;
    if (map()) { map().clear(); }
    title.textContent = 'stopped';
    say('^C stopped', 'warn');
  }

  function show(what) {
    var s = st.last;
    if (!s) { say('nothing to show yet; run a scenario first.', 'dim'); return; }
    var opts = Object.keys(s.show || {});
    if (!what) { say('show: pick one of ' + (opts.join(', ') || 'none for this scenario'), 'dim'); return; }
    if (s.show && s.show[what]) { json(s.show[what], st.lastModel); return; }
    if (what === 'llm' || what === 'record') {
      var archived = (s.steps || []).some(function (x) { return x.state === 'archive'; });
      if (archived) { say('no ' + what + ': this incident was archived at L3, so the LLM never saw it. That is the filter doing its job.', 'dim'); return; }
    }
    say(what + ' is not recorded for ' + s.id + '. available: ' + (opts.join(', ') || 'none'), 'dim');
  }

  function verdict(kind, sev) {
    var s = st.last;
    if (!s || !(s.show && s.show.llm)) { say('verdict: no recommendation is waiting for review. run an attack scenario that reaches the LLM.', 'dim'); return; }
    if (st.verdict) { say('verdict already recorded for this incident (' + st.verdict + ').', 'dim'); return; }
    var inc = 'inc-?';
    try { inc = JSON.parse(fill(s.show.normalized || '{}')).incident_id || inc; } catch (e) { /* keep placeholder */ }
    var rec = { incident_id: inc, model: modelName(st.lastModel), prompt_version: 'v3' };
    if (kind === 'accept') {
      rec.analyst_verdict = 'accepted';
    } else if (kind === 'correct' && SEVERITIES.indexOf(sev) >= 0) {
      rec.analyst_verdict = 'corrected';
      rec.corrected_severity = sev;
    } else {
      say('usage: verdict accept | verdict correct <low|medium|high|critical>', 'fail');
      return;
    }
    rec.ground_truth = 'separate table, joined only at evaluation time';
    st.verdict = rec.analyst_verdict;
    print('<span class="t">' + hms(new Date()) + '</span> <span class="s">postgres</span> <span class="ok">UPDATE incidents SET analyst_verdict = \'' + esc(rec.analyst_verdict) + '\' WHERE id = \'' + esc(inc) + '\'</span>');
    json(JSON.stringify(rec));
    if (rec.analyst_verdict === 'corrected') { say('stored as a disagreement with the model; agreement rate is reported next to accuracy in the evaluation.', 'dim'); }
  }

  function model(key) {
    if (!key) {
      table(Object.keys(models).map(function (k) { return [(k === st.model ? '* ' : '  ') + k, models[k]]; }));
      return;
    }
    if (!models[key]) { say('model: unknown "' + key + '". choose ' + Object.keys(models).join(' or '), 'fail'); return; }
    st.model = key;
    say('model set to ' + models[key] + ' · temperature 0 · seed 42 · prompt v3', 'ok');
  }

  function replay(id) {
    var s = byId[id];
    if (!s) { say('replay: unknown scenario "' + (id || '') + '"', 'fail'); return; }
    if (!(s.show && s.show.llm)) { say('replay: ' + id + ' never reaches the LLM (archived at L3), so there is nothing to compare.', 'dim'); return; }
    if (st.busy) { say('a scenario is already running; stop it first.', 'warn'); return; }
    var me = ++st.run;
    st.busy = true;
    resetTrace('replay · ' + s.name);
    say('replaying the recorded alerts of ' + id + ' from postgres: same normalized input, prompt v3, temperature 0, seed 42', 'dim');
    [1, 2, 3].forEach(function (l) { setTrace(l, 'ok'); });
    var keys = Object.keys(models);
    var chain = Promise.resolve();
    keys.forEach(function (k) {
      chain = chain.then(function () {
        if (me !== st.run) { return; }
        setTrace(4, 'run');
        var go = map() ? map().travel('n8n', 'ollama', 650).then(function () { return map().travel('ollama', 'n8n', 900); }) : wait(900);
        return go.then(function () {
          if (me !== st.run) { return; }
          print('<span class="t">' + hms(new Date()) + '</span> <span class="s">n8n</span> <span class="ok">' + esc(models[k]) + ': response stored for offline scoring</span>');
        });
      });
    });
    chain.then(function () {
      if (me !== st.run) { return; }
      setTrace(4, 'ok');
      setTrace(5, 'ok');
      st.busy = false;
      if (map()) { map().clear(); }
      say('both outputs are scored against the ground truth offline; the numbers appear on the Results tab once the evaluation has run.', 'dim');
    });
  }

  function exec(line) {
    var raw = line.trim();
    print('<span class="cmd">' + esc(raw) + '</span>');
    if (!raw) { return; }
    history.push(raw);
    hpos = history.length;
    var a = raw.split(/\s+/);
    var cmd = a[0].toLowerCase();
    var mi = a.indexOf('--model');
    var mk = mi > 0 ? a[mi + 1] : null;
    if (mk && !models[mk]) { say('--model: unknown "' + mk + '". choose ' + Object.keys(models).join(' or '), 'fail'); return; }
    switch (cmd) {
      case 'help': case '?': help(); break;
      case 'scenarios': case 'ls': list(); break;
      case 'run': run(a[1], mk); break;
      case 'stop': stop(); break;
      case 'show': case 'cat': case 'verdict':
        if (st.busy) { say(cmd + ': wait for the scenario to finish, or stop it.', 'warn'); break; }
        if (cmd === 'verdict') { verdict(a[1], (a[2] || '').toLowerCase()); } else { show(a[1]); }
        break;
      case 'model': model(a[1]); break;
      case 'replay': replay(a[1]); break;
      case 'clear': out.innerHTML = ''; break;
      case 'history': history.slice(-15).forEach(function (h, i) { say(String(history.length - Math.min(15, history.length) + i + 1).padStart(4) + '  ' + h); }); break;
      default:
        if (TOOLS[cmd]) {
          say(cmd + ': not available here. This console drives the detection pipeline; attacks run as scripted, labelled scenarios from the researcher laptop.', 'warn');
          say('try: run ' + TOOLS[cmd], 'dim');
        } else {
          say(cmd + ': command not found. type help.', 'fail');
        }
    }
  }

  /* --- input --- */

  function complete() {
    var v = input.value;
    var parts = v.replace(/^\s+/, '').split(/\s+/);
    var pool;
    if (parts.length <= 1) { pool = COMMANDS; }
    else if (parts[0] === 'run' || parts[0] === 'replay') { pool = scenarios.map(function (s) { return s.id; }); }
    else if (parts[0] === 'show') { pool = ['raw', 'normalized', 'llm', 'record']; }
    else if (parts[0] === 'model') { pool = Object.keys(models); }
    else if (parts[0] === 'verdict') { pool = parts.length === 2 ? ['accept', 'correct'] : SEVERITIES; }
    else { return false; }
    var word = parts[parts.length - 1];
    var hits = pool.filter(function (p) { return p.indexOf(word) === 0; });
    if (!hits.length) { return false; }
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      input.value = parts.join(' ') + ' ';
    } else {
      var pre = hits.reduce(function (acc, h) { while (h.indexOf(acc) !== 0) { acc = acc.slice(0, -1); } return acc; });
      parts[parts.length - 1] = pre;
      input.value = parts.join(' ');
      say(hits.join('   '), 'dim');
    }
    return true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    exec(v);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) {
      if (complete()) { e.preventDefault(); }
    } else if (e.key === 'ArrowUp') {
      if (hpos > 0) { hpos--; input.value = history[hpos]; e.preventDefault(); }
    } else if (e.key === 'ArrowDown') {
      if (hpos < history.length) { hpos++; input.value = history[hpos] || ''; e.preventDefault(); }
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && input.selectionStart === input.selectionEnd) {
      e.preventDefault();
      say('^C', 'dim');
      stop(true);
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  root.querySelector('.hl-term-quick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cmd]');
    if (!b) { return; }
    if (st.busy) { stop(true); }
    exec(b.dataset.cmd);
  });

  out.addEventListener('click', function () {
    if (!window.getSelection || !String(window.getSelection())) { input.focus({ preventScroll: true }); }
  });

  root.hidden = false;
  say('labctl · thesis testbed console (simulation, illustrative data)', 'dim');
  print('type <span class="cmd-inline ok">scenarios</span> to list attack types, <span class="ok">run ssh-bruteforce</span> to start one, or <span class="ok">help</span>.');
  resetTrace('no scenario running');
})();
