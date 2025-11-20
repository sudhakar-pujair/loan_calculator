(() => {

  const principalEl = document.getElementById('principal');
  const emiEl = document.getElementById('emi');
  const rateEl = document.getElementById('rate');

  const calculateBtn = document.getElementById('calculate');
  const excelBtn = document.getElementById('downloadExcel');
  const pdfBtn = document.getElementById('downloadPdf');

  const tableBody = document.querySelector('#scheduleTable tbody');

  const r_principal = document.getElementById('r_principal');
  const r_emi = document.getElementById('r_emi');
  const r_rate = document.getElementById('r_rate');
  const r_months = document.getElementById('r_months');
  const r_interest = document.getElementById('r_interest');
  const r_total_paid = document.getElementById('r_total_paid');

  /* -------------------------
     THEME TOGGLE
  -------------------------- */
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");

  themeToggle.onclick = () => {
    if (themeToggle.checked) {
      document.body.classList.remove("light");
      themeLabel.innerText = "Dark";
    } else {
      document.body.classList.add("light");
      themeLabel.innerText = "Light";
    }
  };

  /* -------------------------
     VALIDATION
  -------------------------- */
  function validate(P, EMI, R) {
    if (!P || P <= 0) return alert("Please enter valid Principal");
    if (!EMI || EMI <= 0) return alert("Please enter valid EMI");
    if (!R || R <= 0) return alert("Please enter valid Interest Rate");
    return true;
  }

  /* -------------------------
     CALCULATION
  -------------------------- */
  function buildSchedule(P, EMI, rate) {
    let balance = P;
    let month = 0;
    const monthlyRate = rate / 12 / 100;
    let totalInterest = 0;

    const rows = [];

    while (balance > 0) {
      month++;

      const interest = balance * monthlyRate;
      let principalRepaid = EMI - interest;
      let closing = balance - principalRepaid;

      if (closing < 0) {
        principalRepaid = balance;
        closing = 0;
      }

      rows.push({
        month,
        opening: balance,
        emi: EMI,
        principalRepaid,
        interest,
        closing,
      });

      totalInterest += interest;
      balance = closing;
    }

    return {
      rows,
      months: rows.length,
      totalInterest,
    };
  }

  /* -------------------------
     RENDER SUMMARY
  -------------------------- */
  function renderSummary(s) {
    r_principal.innerText = "₹" + s.principal.toLocaleString();
    r_emi.innerText = "₹" + s.emi.toLocaleString();
    r_rate.innerText = s.rate + "%";
    r_months.innerText = s.months;
    r_interest.innerText = "₹" + s.totalInterest.toLocaleString();
    r_total_paid.innerText = "₹" + (s.principal + s.totalInterest).toLocaleString();
  }

  /* -------------------------
     RENDER TABLE
  -------------------------- */
  function renderTable(rows) {
    tableBody.innerHTML = "";
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.month}</td>
        <td>₹${r.opening.toFixed(2)}</td>
        <td>₹${r.emi}</td>
        <td>₹${r.principalRepaid.toFixed(2)}</td>
        <td>₹${r.interest.toFixed(2)}</td>
        <td>₹${r.closing.toFixed(2)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  /* -------------------------
     CALCULATE BUTTON
  -------------------------- */
  let scheduleData = [];
  let summaryData = {};

  calculateBtn.onclick = () => {
    const P = Number(principalEl.value);
    const EMI = Number(emiEl.value);
    const rate = Number(rateEl.value);

    if (!validate(P, EMI, rate)) return;

    const out = buildSchedule(P, EMI, rate);

    scheduleData = out.rows;
    summaryData = {
      principal: P,
      emi: EMI,
      rate,
      months: out.months,
      totalInterest: out.totalInterest,
    };

    renderSummary(summaryData);
    renderTable(scheduleData);
  };

  /* -------------------------
     EXPORT EXCEL
  -------------------------- */
  excelBtn.onclick = () => {
    if (!scheduleData.length) return alert("Please calculate first.");

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Loan Summary"],
      ["Principal", summaryData.principal],
      ["EMI", summaryData.emi],
      ["Interest Rate", summaryData.rate + "%"],
      ["Total Months", summaryData.months],
      ["Total Interest Paid", summaryData.totalInterest],
      ["Total Paid", summaryData.principal + summaryData.totalInterest],
    ]);

    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Month", "Opening", "EMI", "Principal Repaid", "Interest", "Closing"],
      ...scheduleData.map((r) => [
        r.month,
        r.opening,
        r.emi,
        r.principalRepaid,
        r.interest,
        r.closing,
      ]),
    ]);

    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    XLSX.writeFile(wb, "EMI_Schedule.xlsx");
  };

  /* -------------------------
     EXPORT PDF
  -------------------------- */
  pdfBtn.onclick = async () => {
    if (!scheduleData.length) return alert("Please calculate first.");

    const target = document.getElementById("pdfContent");
    const canvas = await html2canvas(target, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");

    const width = pdf.internal.pageSize.width - 40;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 20, 20, width, height);
    pdf.save("EMI_Schedule.pdf");
  };

})();
