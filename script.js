// ----------------------------
// EMI Calculator App (All features)
// ----------------------------
(() => {
  // DOM
  const principalEl = document.getElementById('principal');
  const emiEl = document.getElementById('emi');
  const rateEl = document.getElementById('rate');
  const tenureEl = document.getElementById('tenure');

  const calculateBtn = document.getElementById('calculate');
  const downloadExcelBtn = document.getElementById('downloadExcel');
  const downloadPdfBtn = document.getElementById('downloadPdf');

  const r_principal = document.getElementById('r_principal');
  const r_emi = document.getElementById('r_emi');
  const r_rate = document.getElementById('r_rate');
  const r_months = document.getElementById('r_months');
  const r_interest = document.getElementById('r_interest');
  const r_total_principal = document.getElementById('r_total_principal');

  const scheduleTableBody = document.querySelector('#scheduleTable tbody');

  const errPrincipal = document.getElementById('errPrincipal');
  const errEmi = document.getElementById('errEmi');
  const errRate = document.getElementById('errRate');
  const errTenure = document.getElementById('errTenure');

  // charts
  let balanceChart, doughnutChart;
  const balanceCtx = document.getElementById('balanceChart').getContext('2d');
  const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');

  // theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const currentTheme = localStorage.getItem('emi_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'dark' : 'light');
  themeToggle.checked = currentTheme === 'dark';
  themeLabel.innerText = currentTheme === 'dark' ? 'Dark' : 'Light';

  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    themeLabel.innerText = theme === 'dark' ? 'Dark' : 'Light';
    localStorage.setItem('emi_theme', theme);
  });

  // debounce helper
  function debounce(fn, ms = 300){ let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); } }

  // global schedule
  let currentSchedule = [];
  let currentSummary = {
    principal: 0, emi: 0, rate: 0, months: 0, totalInterest: 0, totalPrincipalPaid: 0
  };

  // validation
  function validateInputs(P, EMIVal, rateVal, tenureVal) {
    let ok = true;
    errPrincipal.innerText = ''; errEmi.innerText = ''; errRate.innerText = ''; errTenure.innerText = '';

    if (!P || isNaN(P) || P <= 0) { errPrincipal.innerText = 'Enter a valid principal'; ok = false; }
    if ((!EMIVal || EMIVal <= 0) && (!tenureVal || tenureVal <= 0)) {
      errEmi.innerText = 'Enter EMI or Tenure';
      errTenure.innerText = 'Enter Tenure or EMI';
      ok = false;
    }
    if (!rateVal || isNaN(rateVal) || rateVal <= 0) { errRate.innerText = 'Enter valid interest'; ok = false; }

    return ok;
  }

  // EMI formula: EMI = P*r*(1+r)^n / ((1+r)^n -1), where r is monthly
  function computeEmiFromTenure(P, annualRate, nMonths) {
    const r = annualRate / 12 / 100;
    if (r === 0) return P / nMonths;
    const pow = Math.pow(1 + r, nMonths);
    return (P * r * pow) / (pow - 1);
  }

  // Build schedule (if EMI given we iterate until balance 0; if tenure given we try to use tenure)
  function buildSchedule(P, EMIVal, annualRate, tenureProvidedMonths = null) {
    const monthlyRate = annualRate / 12 / 100;
    let balance = Number(P);
    let month = 0;
    let lastEmi = EMIVal;
    const rows = [];

    // if EMI not provided but tenure provided -> compute EMI via formula
    if ((!EMIVal || EMIVal <= 0) && tenureProvidedMonths && tenureProvidedMonths > 0) {
      EMIVal = computeEmiFromTenure(P, annualRate, tenureProvidedMonths);
      lastEmi = EMIVal;
    }

    // guard: EMI must be > first month interest
    const firstMonthInterest = balance * monthlyRate;
    if (EMIVal <= firstMonthInterest) {
      throw new Error(`EMI too low. First month interest: ${firstMonthInterest.toFixed(2)}`);
    }

    while (balance > 0 && month < 10000) {
      month++;
      const interest = balance * monthlyRate;
      let principalRepaid = EMIVal - interest;
      let closingBalance = balance - principalRepaid;

      if (closingBalance < 0.005) { // final payment adjust
        principalRepaid = balance;
        lastEmi = balance + interest;
        closingBalance = 0;
      }

      rows.push({
        month,
        opening: Number(balance.toFixed(2)),
        emi: Number(lastEmi.toFixed(2)),
        principalRepaid: Number(principalRepaid.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        closing: Number(closingBalance.toFixed(2))
      });

      balance = closingBalance;
    }

    // compute totals
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const totalPrincipalPaid = rows.reduce((s, r) => s + r.principalRepaid, 0);

    return { rows, months: rows.length, totalInterest, totalPrincipalPaid, emiUsed: EMIVal };
  }

  // render schedule table
  function renderTable(rows) {
    scheduleTableBody.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center">${r.month}</td>
        <td>₹${Number(r.opening).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td>₹${Number(r.emi).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td>₹${Number(r.principalRepaid).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td>₹${Number(r.interest).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td>₹${Number(r.closing).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      `;
      frag.appendChild(tr);
    }
    scheduleTableBody.appendChild(frag);
  }

  // render summary
  function renderSummary(summary) {
    r_principal.innerText = `₹${Number(summary.principal).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    r_emi.innerText = `₹${Number(summary.emi).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    r_rate.innerText = `${Number(summary.rate).toFixed(2)}%`;
    r_months.innerText = summary.months;
    r_interest.innerText = `₹${Number(summary.totalInterest).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    r_total_principal.innerText = `₹${Number(summary.totalPrincipalPaid).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }

  // render charts
  function renderCharts(rows, summary) {
    const labels = rows.map(r => `M${r.month}`);
    const balances = rows.map(r => r.opening);
    const principalTotal = summary.totalPrincipalPaid || 0;
    const interestTotal = summary.totalInterest || 0;

    // balance line chart
    if (balanceChart) balanceChart.destroy();
    balanceChart = new Chart(balanceCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Outstanding Balance',
            data: balances,
            borderColor: 'rgba(79,129,189,1)',
            backgroundColor: 'rgba(79,129,189,0.08)',
            tension: 0.25,
            fill: true,
            pointRadius: 2
          }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, ticks: { callback: v => '₹' + Number(v).toLocaleString() } }
        },
        responsive: true,
        maintainAspectRatio:false
      }
    });

    // doughnut chart
    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Principal Paid', 'Interest Paid'],
        datasets: [{
          data: [principalTotal, interestTotal],
          backgroundColor: ['rgba(0,122,255,0.9)','rgba(255,99,132,0.85)']
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        responsive:true,
        maintainAspectRatio:false
      }
    });
  }

  // main compute & render
  function computeAndRender() {
    // parse inputs
    const P = Number(principalEl.value) || 0;
    const EMIInput = Number(emiEl.value) || 0;
    const rateVal = Number(rateEl.value) || 0;
    const tenureVal = Number(tenureEl.value) || 0;

    // validate
    if (!validateInputs(P, EMIInput, rateVal, tenureVal)) {
      return;
    }

    try {
      const result = buildSchedule(P, EMIInput, rateVal, tenureVal || null);
      currentSchedule = result.rows;
      currentSummary = {
        principal: P,
        emi: result.emiUsed,
        rate: rateVal,
        months: result.months,
        totalInterest: Number(result.totalInterest.toFixed(2)),
        totalPrincipalPaid: Number(result.totalPrincipalPaid.toFixed(2))
      };

      // render
      renderSummary(currentSummary);
      renderTable(currentSchedule);
      renderCharts(currentSchedule, currentSummary);
    } catch (err) {
      alert(err.message);
    }
  }

  // wire calculate button (and also support live calculation on input)
  calculateBtn.addEventListener('click', computeAndRender);

  // Live calculation (debounced)
  const liveInputs = [principalEl, emiEl, rateEl, tenureEl];
  liveInputs.forEach(el => el.addEventListener('input', debounce(() => {
    // Only live-calc if all required fields present (no errors)
    const P = Number(principalEl.value) || 0;
    const rateVal = Number(rateEl.value) || 0;
    const EMIInput = Number(emiEl.value) || 0;
    const tenureVal = Number(tenureEl.value) || 0;
    if (validateInputs(P, EMIInput, rateVal, tenureVal)) computeAndRender();
  }, 450)));

  // INITIAL EMPTY CHARTS
  function initEmptyCharts() {
    if (balanceChart) balanceChart.destroy();
    balanceChart = new Chart(balanceCtx, { type:'line', data:{labels:[],datasets:[]}, options:{maintainAspectRatio:false} });
    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(doughnutCtx, { type:'doughnut', data:{labels:[],datasets:[]}, options:{maintainAspectRatio:false} });
  }
  initEmptyCharts();

  // Excel download (SheetJS) with formatting
  downloadExcelBtn.addEventListener('click', function () {
    if (!currentSchedule || !currentSchedule.length) { alert('Please calculate first'); return; }

    const wb = XLSX.utils.book_new();

    // SUMMARY sheet
    const summaryAoA = [
      ['Loan EMI Summary'],
      [],
      ['Principal', currentSummary.principal],
      ['EMI', currentSummary.emi],
      ['Interest Rate', `${currentSummary.rate}%`],
      ['Total Months', currentSummary.months],
      ['Total Interest Paid', currentSummary.totalInterest]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryAoA);

    // Basic styling via .s (SheetJS Pro features limited; but some clients support)
    if (!ws1['A1'].s) ws1['A1'].s = {};
    ws1['A1'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal:'center' } };
    // number formats
    ws1['B3'] && (ws1['B3'].z = '₹#,##0.00');
    ws1['B4'] && (ws1['B4'].z = '₹#,##0.00');
    ws1['B6'] && (ws1['B6'].z = '₹#,##0.00');

    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // SCHEDULE sheet
    const header = [['Month','Opening Principal','EMI','Principal Repaid','Interest','Closing Principal']];
    const rows = currentSchedule.map(r => [r.month, r.opening, r.emi, r.principalRepaid, r.interest, r.closing]);
    const ws2 = XLSX.utils.aoa_to_sheet(header.concat(rows));

    // Set column widths
    ws2['!cols'] = [{wpx:60},{wpx:140},{wpx:100},{wpx:140},{wpx:120},{wpx:140}];

    // set number format for numeric cells
    for (let R=2; R<=rows.length+1; R++){
      ['B','C','D','E','F'].forEach(col => {
        const cell = ws2[col + R];
        if (cell) cell.z = (col === 'A') ? '0' : '₹#,##0.00';
      });
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Schedule');

    // Write
    const fileName = `EMI_Schedule_${currentSummary.principal || 'loan'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  });

  // PDF download (capture #pdfContent)
  downloadPdfBtn.addEventListener('click', async () => {
    if (!currentSchedule || !currentSchedule.length) { alert('Please calculate first'); return; }
    const pdfTarget = document.getElementById('pdfContent'); // schedule table area
    // render canvas
    const canvas = await html2canvas(pdfTarget, { scale: 2, useCORS: true, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // scale image to fit width
    const imgWidth = pageWidth - 40; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    // add summary text on new page
    pdf.addPage();
    pdf.setFontSize(12);
    pdf.text(`Principal: ${r_principal.innerText}`, 30, 40);
    pdf.text(`EMI: ${r_emi.innerText}`, 30, 60);
    pdf.text(`Interest Rate: ${r_rate.innerText}`, 30, 80);
    pdf.text(`Total Months: ${r_months.innerText}`, 30, 100);
    pdf.text(`Total Interest Paid: ${r_interest.innerText}`, 30, 120);

    pdf.save(`EMI_Schedule_${currentSummary.principal || 'loan'}.pdf`);
  });

  // Allow pressing Enter on any field to calculate
  ['keyup','keypress'].forEach(evt =>
    document.addEventListener(evt, function(e){
      if ((e.key === 'Enter' || e.keyCode === 13) && (document.activeElement.tagName === 'INPUT')) {
        e.preventDefault();
        computeAndRender();
      }
    })
  );

  // convenience
  function computeAndRender() {
    try {
      computeAndRenderImpl();
    } catch(err) {
      console.error(err);
      alert(err.message || 'Error computing schedule');
    }
  }

  function computeAndRenderImpl(){
    const P = Number(principalEl.value) || 0;
    const EMIInput = Number(emiEl.value) || 0;
    const rateVal = Number(rateEl.value) || 0;
    const tenureVal = Number(tenureEl.value) || 0;

    if (!validateInputs(P, EMIInput, rateVal, tenureVal)) return;

    const out = buildSchedule(P, EMIInput, rateVal, tenureVal || null);
    currentSchedule = out.rows;
    currentSummary = {
      principal: P,
      emi: out.emiUsed,
      rate: rateVal,
      months: out.months,
      totalInterest: Number(out.totalInterest.toFixed(2)),
      totalPrincipalPaid: Number(out.totalPrincipalPaid.toFixed(2))
    };

    renderSummary(currentSummary);
    renderTable(currentSchedule);
    renderCharts(currentSchedule, currentSummary);
  }

  // expose minimal helpers to window for debugging (optional)
  window._emiApp = {
    computeAndRenderImpl, buildSchedule, computeEmiFromTenure
  };
})();
