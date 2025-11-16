// Form elements
const principalInput = document.getElementById('principal');
const rateInput = document.getElementById('rate');
const yearsInput = document.getElementById('years');
const reinvestInput = document.getElementById('reinvestPct');

const calculateBtn = document.getElementById('calculate');
const resetBtn = document.getElementById('reset');
const exportBtn = document.getElementById('exportCsv');

const resultTableBody = document.querySelector('#resultTable tbody');
const summaryDiv = document.getElementById('summary');

// Helper: formatos
const fmt = (v) => {
    // Presentación con símbolo $ y separador de miles
    // no usamos Intl currency específico para evitar dependencias
    const num = Number(v);
    if (!isFinite(num)) return v;
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

function clearOutputs() {
    resultTableBody.innerHTML = '';
    summaryDiv.innerHTML = '';
    summaryDiv.hidden = true;
}

function calculate() {
    clearOutputs();

    const P = parseFloat(principalInput.value);
    const rPct = parseFloat(rateInput.value);
    const nYears = parseInt(yearsInput.value, 10);
    const reinvestPct = parseFloat(reinvestInput.value);

    if (isNaN(P) || P < 0 || isNaN(rPct) || isNaN(nYears) || nYears <= 0 || reinvestPct < 0 || reinvestPct > 10000) {
        alert('Por favor verifica los valores. Años debe ser >= 1 y reinvertir entre 0 y 10000.');
        return;
    }

    const r = rPct / 100;
    const reinvestFraction = reinvestPct / 100;

    let saldo = P;
    let totalInteres = 0;
    let totalReinvertido = 0;
    let totalRetirado = 0;

    const rows = [];

    for (let year = 1; year <= nYears; year++) {
        const interes = saldo * r;
        const reinvertido = interes * reinvestFraction;
        const saldoFin = saldo + reinvertido;

        rows.push({
            year,
            saldoInicio: saldo,
            interes,
            reinvertido,
            saldoFin
        });

        totalInteres += interes;
        totalReinvertido += reinvertido;
        saldo = saldoFin;
    }

    // Poblamos la tabla
    const frag = document.createDocumentFragment();
    rows.forEach(rw => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${rw.year}</td>
          <td>${fmt(rw.saldoInicio)}</td>
          <td>${fmt(rw.interes)}</td>
          <td>${fmt(rw.reinvertido)}</td>
          <td>${fmt(rw.saldoFin)}</td>
        `;
        frag.appendChild(tr);
    });
    resultTableBody.appendChild(frag);

    // Resumen
    const finalSaldo = saldo;
    summaryDiv.hidden = false;
    summaryDiv.innerHTML = `
        <strong>Resumen</strong>
        <div class="small" style="margin-top:6px">
          Saldo final: <strong>${fmt(finalSaldo)}</strong><br>
          Interés total ganado: <strong>${fmt(totalInteres)}</strong><br>
          Total reinvertido: <strong>${fmt(totalReinvertido)}</strong><br>
        </div>
      `;

    // Habilitar export
    exportBtn.disabled = false;
    exportBtn.dataset.csv = buildCSV(rows);
}

function buildCSV(rows) {
    const headers = ['Año', 'Saldo inicio', 'Interés ganado', 'Reinvertido', 'Saldo fin'];
    const lines = [headers.join(',')];
    rows.forEach(rw => {
        lines.push([
            rw.year,
            rw.saldoInicio.toFixed(2),
            rw.interes.toFixed(2),
            rw.reinvertido.toFixed(2),
            rw.saldoFin.toFixed(2)
        ].join(','));
    });
    return lines.join('\n');
}

calculateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    calculate();
});

resetBtn.addEventListener('click', () => {
    principalInput.value = '3000';
    rateInput.value = '5';
    yearsInput.value = '10';
    reinvestInput.value = '100';
    clearOutputs();
});

exportBtn.addEventListener('click', () => {
    const csv = exportBtn.dataset.csv;
    if (!csv) {
        alert('Primero realiza el cálculo para poder exportar.');
        return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interes_compuesto.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
});

// Ejecutar cálculo inicial para mostrar ejemplo
window.addEventListener('load', () => {
    calculate();
});