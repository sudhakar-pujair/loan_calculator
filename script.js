(() => {

  // INPUT ELEMENTS
  const principalEl = document.getElementById("principal");
  const emiEl = document.getElementById("emi");
  const rateEl = document.getElementById("rate");

  // BUTTONS
  const calculateBtn = document.getElementById("calculate");
  const excelBtn = document.getElementById("downloadExcel");
  const pdfBtn = document.getElementById("downloadPdf");

  // SUMMARY FIELDS
  const r_principal = document.getElementById("r_principal");
  const r_emi = document.getElementById("r_emi");
  const r_rate = document.getElementById("r_rate");
  const r_months = document.getElementById("r_months");
  const r_interest = document.getElementById("r_interest");
  const r_total_paid = document.getElementById("r_total_paid");

  const tableBody = document.querySelector("#scheduleTable tbody");

  let scheduleData = [];
  let summaryData = {};

  /* -----------------------------
     VALIDATE INPUTS
  ------------------------------ */
  function validate(P, EMI, rate) {
    if (!P || P <= 0) return alert("Enter valid Principal");
    if (!EMI || EMI <= 0) return alert("Enter valid EMI");
    if (!rate || rate <= 0) return alert("Enter valid Interest Rate");
    return true;
  }

  /* -----------------------------
     BUILD EMI SCHEDULE
  ------------------------------ */
  function buildSchedule(P, EMI, rate) {
    const mRate = rate / 12 / 100;
    let balance = P;
    let month = 0;
    let totalInterest = 0;
    const rows = [];

    while (balance > 0) {
      month++;

      const interest = balance * mRate;
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
        closing
      });

      totalInterest += interest;
      balance = closing;
    }

    return {
      rows,
      months: rows.length,
      totalInterest
    };
  }

  /* -----------------------------
     RENDER SUMMARY
  ------------------------------ */
  function renderSummary(sum) {
    r_principal.innerText = "₹" + sum.principal.toLocaleString();
    r_emi.innerText = "₹" + sum.emi.toLocaleString();
    r_rate.innerText = sum.rate + "%";
    r_months.innerText = sum.months;
    r_interest.innerText = "₹" + sum.totalInterest.toLocaleString();
    r_total_paid.innerText =
      "₹" + (sum.principal + sum.totalInterest).toLocaleString();
  }

  /* -----------------------------
     RENDER TABLE
  ------------------------------ */
  function renderTable(rows) {
    tableBody.innerHTML = "";
    rows.forEach(r => {
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

  /* -----------------------------
     CALCULATE BUTTON
  ------------------------------ */
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
      totalInterest: out.totalInterest
    };

    renderSummary(summaryData);
    renderTable(scheduleData);
  };

  /* -----------------------------
     EXCEL DOWNLOAD
  ------------------------------ */
  excelBtn.onclick = () => {
    if (!scheduleData.length) return alert("Calculate first.");

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Summary"],
      ["Principal", summaryData.principal],
      ["EMI", summaryData.emi],
      ["Rate", summaryData.rate],
      ["Months", summaryData.months],
      ["Total Interest", summaryData.totalInterest],
      ["Total Paid", summaryData.principal + summaryData.totalInterest]
    ]);

    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    const ws2 = XLSX.utils.aoa_to_sheet([
      [
        "Month",
        "Opening",
        "EMI",
        "Principal Repaid",
        "Interest",
        "Closing"
      ],
      ...scheduleData.map(r => [
        r.month,
        r.opening,
        r.emi,
        r.principalRepaid,
        r.interest,
        r.closing
      ])
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    XLSX.writeFile(wb, "EMI_Schedule.xlsx");
  };

  /* -----------------------------
     PDF DOWNLOAD
  ------------------------------ */
  pdfBtn.onclick = async () => {
    if (!scheduleData.length) return alert("Calculate first.");

    const target = document.getElementById("pdfContent");
    const canvas = await html2canvas(target);
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");

    const width = pdf.internal.pageSize.width - 40;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 20, 20, width, height);
    pdf.save("EMI_Schedule.pdf");
  };

  /* -----------------------------
     SIDEBAR COLLAPSE FIX
  ------------------------------ */
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleSidebar");

  toggleBtn.onclick = () => {
    sidebar.classList.toggle("collapsed");
  };

})();
