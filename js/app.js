// Referencias a los elementos del DOM
const sliderT0 = document.getElementById('sliderT0');
const inputT0 = document.getElementById('inputT0');

const sliderTm = document.getElementById('sliderTm');
const inputTm = document.getElementById('inputTm');

const sliderK = document.getElementById('sliderK');
const inputK = document.getElementById('inputK');

const sliderDt = document.getElementById('sliderDt');
const inputDt = document.getElementById('inputDt');

const sliderN = document.getElementById('sliderN');
const inputN = document.getElementById('inputN');

const btnReset = document.getElementById('btnReset');
const dataTableBody = document.getElementById('dataTableBody');
const mathSub1 = document.getElementById('mathSub1');
const mathSub2 = document.getElementById('mathSub2');

let coolingChart;

// Inicialización de la gráfica Chart.js
function initChart() {
  const ctx = document.getElementById('coolingChart').getContext('2d');
  coolingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperatura T (°C)',
          data: [],
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2
        },
        {
          label: 'Temperatura ambiente Tₘ (°C)',
          data: [],
          borderColor: '#10b981',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
      },
      scales: {
        x: { title: { display: true, text: 'Tiempo (min)', font: { size: 10 } } },
        y: { title: { display: true, text: 'Temperatura (°C)', font: { size: 10 } } }
      }
    }
  });
}

// Sincronizar Sliders y Cajas Numéricas restringiendo estrictamente MIN y MAX
function bindInputPair(slider, input) {
  // 1. Al mover la barra deslizante
  slider.addEventListener('input', () => {
    input.value = slider.value;
    updateSimulation();
  });

  // 2. Al perder el foco (blur) o presionar Enter (change): corrige el valor final
  const clampValue = () => {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    let val = parseFloat(input.value);

    if (isNaN(val)) {
      val = min;
    } else if (val < min) {
      val = min;
    } else if (val > max) {
      val = max;
    }

    input.value = val;
    slider.value = val;
    updateSimulation();
  };

  input.addEventListener('change', clampValue);
  input.addEventListener('blur', clampValue);

  // 3. Mientras se escribe en la casilla: bloquea al instante mayores al MAX y menores al MIN
  input.addEventListener('input', () => {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    let val = parseFloat(input.value);

    if (!isNaN(val)) {
      // Bloquea si supera el máximo
      if (val > max) {
        input.value = max;
        slider.value = max;
      } 
      // Bloquea si es inferior al mínimo (negativos en positivos o bajo el limite permitido)
      else if (val < min) {
        if (val < 0 && min >= 0) {
          input.value = min;
          slider.value = min;
        } else if (val < 0 && min < 0 && val < min) {
          input.value = min;
          slider.value = min;
        } else {
          slider.value = min;
        }
      } 
      // Valor válido
      else {
        slider.value = val;
      }
    }
    updateSimulation();
  });
}

bindInputPair(sliderT0, inputT0);
bindInputPair(sliderTm, inputTm);
bindInputPair(sliderK, inputK);
bindInputPair(sliderDt, inputDt);
bindInputPair(sliderN, inputN);

// Función principal de cálculo y renderizado
function updateSimulation() {
  const T0 = parseFloat(inputT0.value) || 0;
  const Tm = parseFloat(inputTm.value) || 0;
  const k = parseFloat(inputK.value) || 0.001;
  const dt = parseFloat(inputDt.value) || 1;
  const n = Math.max(1, parseInt(inputN.value) || 1);

  // Actualizar ecuaciones sustituidas dinámicamente usando comillas invertidas
  const deltaInitial = T0 - Tm;
  const sign = deltaInitial >= 0 ? '+' : '-';
  const absDelta = Math.abs(deltaInitial);

  mathSub1.innerHTML = `T(t) = ${Tm} + (${T0} - ${Tm})e<sup>-${k}t</sup>`;
  mathSub2.innerHTML = `T(t) = ${Tm} ${sign} ${absDelta.toFixed(2).replace('.00', '')}e<sup>-${k}t</sup>`;

  const times = [];
  const temps = [];
  const ambients = [];
  const rawTemps = [];

  // 1. Precalcular temperaturas teóricas para cada instante
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    const temp = Tm + (T0 - Tm) * Math.exp(-k * t);
    times.push(t.toFixed(1));
    temps.push(temp.toFixed(2));
    ambients.push(Tm.toFixed(1));
    rawTemps.push(temp);
  }

  // 2. Construir filas de la tabla con las fórmulas exactas del PDF
  dataTableBody.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('tr');

    const tempCurrent = rawTemps[i];
    const diffAmbient = tempCurrent - Tm;

    let deltaT_div_dt = '-';
    let ratio = '-';

    // Para la tasa ΔT/Δt se requiere el dato siguiente T(i+1)
    if (i < n - 1) {
      const tempNext = rawTemps[i + 1];
      const deltaVal = (tempNext - tempCurrent) / dt;
      deltaT_div_dt = deltaVal.toFixed(4);

      if (diffAmbient !== 0) {
        ratio = (deltaVal / diffAmbient).toFixed(4);
      }
    }

    row.innerHTML = `
      <td>${i}</td>
      <td>${times[i]}</td>
      <td>${temps[i]}</td>
      <td>${deltaT_div_dt}</td>
      <td>${diffAmbient.toFixed(2)}</td>
      <td>${ratio}</td>
    `;
    dataTableBody.appendChild(row);
  }

  // 3. Actualizar datos en la gráfica
  coolingChart.data.labels = times;
  coolingChart.data.datasets[0].data = temps;
  coolingChart.data.datasets[1].data = ambients;
  coolingChart.update();
}

// Botón Reiniciar
btnReset.addEventListener('click', () => {
  sliderT0.value = 80; inputT0.value = 80;
  sliderTm.value = 30; inputTm.value = 30;
  sliderK.value = 0.032; inputK.value = 0.032;
  sliderDt.value = 3; inputDt.value = 3;
  sliderN.value = 21; inputN.value = 21;
  updateSimulation();
});

// Inicialización
initChart();
updateSimulation();