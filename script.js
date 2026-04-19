// =============================================
//  script.js — Logika Kalkulator (Fixed)
// =============================================

let expr      = '';
let display   = '0';
let lastResult = null;
let justCalc  = false;
let isDeg     = true;
let history   = [];

const elExpr = document.getElementById('expr');
const elDisp = document.getElementById('display');

// ── UPDATE LAYAR ──
function updateScreen() {
  elDisp.textContent = display;
  elExpr.textContent = expr;
}

// ── TOGGLE DEG / RAD ──
function toggleDeg() {
  isDeg = !isDeg;
  document.getElementById('degLabel').textContent = isDeg ? 'DEG' : 'RAD';
}

// ── CEK APAKAH PERLU AUTO-INSERT '*' ──
// Dipanggil sebelum menambahkan angka/fungsi/konstanta/kurung buka
function autoMul() {
  if (!expr) return;
  const last = expr.slice(-1);
  // Jika ekspresi terakhir adalah ), angka, atau konstanta → sisipkan *
  if (last === ')' || (last >= '0' && last <= '9') || last === '.') {
    expr += '*';
  }
}

// ── INPUT ANGKA ──
function inputNum(n) {
  if (justCalc) { expr = ''; display = n; justCalc = false; expr += n; updateScreen(); return; }
  autoMul();
  if (display === '0' && n !== '.') display = n;
  else if (['+','−','×','÷','^','mod','(',')'].includes(display)) display = n;
  else display += n;
  expr += n;
  updateScreen();
}

// ── INPUT TITIK DESIMAL ──
function inputDot() {
  if (justCalc) {
    expr = '0.'; display = '0.'; justCalc = false;
    updateScreen(); return;
  }
  const parts = expr.split(/[\+\-\*\/\^]/);
  if (parts[parts.length - 1].includes('.')) return;
  display += '.';
  expr    += '.';
  updateScreen();
}

// ── INPUT OPERATOR ──
function inputOp(op) {
  justCalc = false;
  const sym = { '/':'÷', '*':'×', '-':'−', '+':'+', '**':'^', '%':'mod' }[op] || op;
  display = sym;
  expr   += op;
  updateScreen();
}

// ── INPUT KURUNG ──
function inputParen(p) {
  justCalc = false;
  if (p === '(') autoMul();
  expr    += p;
  display  = p;
  updateScreen();
}

// ── INPUT KONSTANTA (π, e) ──
function inputConst(c) {
  if (justCalc) { expr = ''; justCalc = false; }
  autoMul();
  const val = c === 'Math.PI' ? Math.PI : Math.E;
  display = parseFloat(val.toFixed(8)).toString();
  expr   += val;
  updateScreen();
}

// ── INPUT FUNGSI (sin, cos, dll) ──
function inputFunc(fn) {
  if (justCalc) { expr = ''; justCalc = false; }
  autoMul();
  const lbl = { asin:'sin⁻¹', acos:'cos⁻¹', atan:'tan⁻¹' }[fn] || fn;
  display = lbl + '(';
  expr   += fn + '(';
  updateScreen();
}

// ── INPUT AKAR ──
function inputSqrt() {
  if (justCalc) { expr = ''; justCalc = false; }
  autoMul();
  display  = '√(';
  expr    += 'Math.sqrt(';
  updateScreen();
}

// ── INPUT PERSEN ──
function inputPercent() {
  justCalc = false;
  display  = '%';
  expr    += '/100';
  updateScreen();
}

// ── TOGGLE TANDA +/− ──
function toggleSign() {
  const num = parseFloat(display);
  if (isNaN(num)) return;
  const neg = -num;
  display = neg.toString();
  expr    = expr.slice(0, -Math.abs(num).toString().length) + neg.toString();
  updateScreen();
}

// ── HAPUS SEMUA ──
function clearAll() {
  expr = ''; display = '0'; lastResult = null; justCalc = false;
  updateScreen();
}

// ── HAPUS ENTRY TERAKHIR ──
function clearEntry() {
  display = '0';
  updateScreen();
}

// ── HAPUS 1 KARAKTER TERAKHIR ──
function deleteLast() {
  if (justCalc) { clearAll(); return; }
  if (!expr) return;
  expr    = expr.slice(0, -1);
  display = expr.slice(-1) || '0';
  updateScreen();
}

// ── FORMAT ANGKA HASIL ──
function fmtNum(n) {
  if (!isFinite(n)) return isNaN(n) ? 'Error' : (n > 0 ? '∞' : '-∞');
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toPrecision(12)).toString();
}

// ── HITUNG HASIL ──
function calculate() {
  if (!expr) return;
  const raw = expr;

  let ev = expr
    .replace(/sin\(/g,  isDeg ? '(x=>Math.sin(x*Math.PI/180))('  : 'Math.sin(')
    .replace(/asin\(/g, isDeg ? '(x=>Math.asin(x)*180/Math.PI)(' : 'Math.asin(')
    .replace(/cos\(/g,  isDeg ? '(x=>Math.cos(x*Math.PI/180))('  : 'Math.cos(')
    .replace(/acos\(/g, isDeg ? '(x=>Math.acos(x)*180/Math.PI)(' : 'Math.acos(')
    .replace(/tan\(/g,  isDeg ? '(x=>Math.tan(x*Math.PI/180))('  : 'Math.tan(')
    .replace(/atan\(/g, isDeg ? '(x=>Math.atan(x)*180/Math.PI)(' : 'Math.atan(')
    .replace(/log\(/g,  'Math.log10(')
    .replace(/ln\(/g,   'Math.log(');

  try {
    const result = Function('"use strict"; return (' + ev + ')')();
    if (!isFinite(result) && !isNaN(result) && result !== Infinity && result !== -Infinity) throw new Error();
    const fmt = fmtNum(result);

    history.unshift({ expr: raw, val: fmt });
    if (history.length > 30) history.pop();
    renderHistory();

    lastResult         = result;
    elExpr.textContent = raw + ' =';
    display = fmt;
    expr    = fmt === 'Error' ? '' : fmt;
    justCalc = true;
    elDisp.textContent = display;

  } catch (e) {
    elExpr.textContent = raw;
    display = 'Error';
    elDisp.textContent = display;
    expr = '';
    justCalc = false;
  }
}

// ── RENDER HISTORY ──
function renderHistory() {
  const el = document.getElementById('histList');
  if (!history.length) {
    el.innerHTML = '<div class="no-hist">Belum ada riwayat.</div>';
    return;
  }
  el.innerHTML = history.map((h, i) =>
    `<div class="hist-item" onclick="recallHist(${i})">
      <span class="h-expr">${h.expr}</span>
      <span class="h-val">${h.val}</span>
    </div>`
  ).join('');
}

// ── RECALL DARI HISTORY ──
function recallHist(i) {
  const h = history[i];
  display  = h.val;
  expr     = h.val;
  justCalc = true;
  switchTab('basic', document.querySelector('.tab'));
  updateScreen();
}

// ── SWITCH TAB ──
function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-basic').style.display = tab === 'basic' ? '' : 'none';
  document.getElementById('panel-sci').style.display   = tab === 'sci'   ? '' : 'none';
  document.getElementById('panel-hist').style.display  = tab === 'hist'  ? '' : 'none';
  if (tab === 'hist') renderHistory();
}

// ── KEYBOARD SUPPORT ──
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9')           inputNum(e.key);
  else if (e.key === '.')                      inputDot();
  else if (e.key === '+')                      inputOp('+');
  else if (e.key === '-')                      inputOp('-');
  else if (e.key === '*')                      inputOp('*');
  else if (e.key === '/') { e.preventDefault(); inputOp('/'); }
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace')              deleteLast();
  else if (e.key === 'Escape')                 clearAll();
});