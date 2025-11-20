// ------------------------------------------------------
// EMI CALCULATOR – FULL JS WITH SIDEBAR COLLAPSE
// ------------------------------------------------------
(() => {

  // Inputs
  const principalEl = document.getElementById('principal');
  const emiEl = document.getElementById('emi');
  const rateEl = document.getElementById('rate');

  // Buttons
  const calculateBtn = document.getElementById('calculate');
  const downloadExcelBtn = document.getElementById('downloadExcel');
  const downloadPdfBtn = document.getElementById('downloadPdf');

  // Summary fields
  const r_principal = document.getElementById('r_principal');
  const r_emi = document.getElementById('r_emi');
  const r_rate = document.getElementById('r_rate');
  const r_months = document.getElementById('r_months');
  const r_interest = document.getElementById('r_interest');
  const r_total_paid = document.getElementById('r_total_paid');

  // Table body
  const tableBody = document.querySelector('#scheduleTable tbody');

  // ------------------------------------------------------
  // DARK THEME DEFAULT
  // ------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.checked = savedTheme === "dark";
  themeLabel.innerText = savedTheme === "dark" ? "Dark" : "Light";

  themeToggle.addEventListener("change", () => {
    const mode = themeToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
    themeLabel.innerText = mode === "dark" ? "Dark" : "Light";
  });

  // ------------------------------------------------------
  // Validate Inputs
  // ------------------------------------------------------
  function validate(P, EMI, rate) {
    if (!P || P <= 0) {
      alert("Please enter valid Principal");
      return false;
    }
    if (!EMI || EMI <= 0) {
      alert("Please enter valid EMI");
      return false;
    }
    if (!rate || rate <= 0) {
      alert("Please enter valid Interest Rate");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------
  // Build EMI Schedule
  // ------------------------------------------------------
  function buildSchedule(P, EMI, rate) {
    const monthlyRate = rate / 12 / 100;
    let balance = P;
    let month = 0;
    let totalInterest = 0;
    const rows = [];

    const firstInterest = balance * monthlyRate;
    if (EMI <= firstInterest) {
      throw new Error("EMI too low! First month interest: ₹" + firstInterest.toFixed(2));
    }

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
        opening: Number(balance.toFixed(2)),
        emi: EMI,
        principalRepaid: Number(principalRepaid.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        closing: Number(closing.toFixed(2))
      });

      totalInterest += interest;
      balance = closing;
    }

    return {
      rows,
      months: rows.length,
      totalInterest: Number(totalInterest.toFixed(2))
    };
  }

  // ------------------------------------------------------
  // Render Summary
  // ------------------------------------------------------
  function renderSummary(sum) {
    r_principal.innerText = "₹" + sum.principal.toLocaleString();
    r_emi.innerText = "₹" + sum.emi.toLocaleString();
    r_rate.innerText = sum.rate + "%";
    r_months.innerText = sum.months;
    r_interest.innerText = "₹" + sum.totalInterest.toLocaleString();

    const totalPaid = sum.principal + sum.totalInterest;
    r_total_paid.innerText = "₹" + totalPaid.toLocaleString();
  }

  // ------------------------------------------------------
  // Render EMI Schedule Table
  // ------------------------------------------------------
  function renderTable(rows) {
    tableBody.innerHTML = "";

    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.month}</td>
        <td>₹${r.opening.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td>₹${r.emi.toLocaleString()}</td>
        <td>₹${r.principalRepaid.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td>₹${r.interest.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td>₹${r.closing.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // ------------------------------------------------------
  // CALCULATE BUTTON
  // ------------------------------------------------------
  let scheduleData = [];
  let summaryData = {};

  function calculate() {
    const P = Number(principalEl.value);
    const EMI = Number(emiEl.value);
    const rate = Number(rateEl.value);

    if (!validate(P, EMI, rate)) return;

    try {
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

    } catch (e) {
      alert(e.message);
    }
  }

  calculateBtn.addEventListener("click", calculate);

  // ------------------------------------------------------
  // EXCEL DOWNLOAD
  // ------------------------------------------------------
  downloadExcelBtn.addEventListener("click", () => {
    if (!scheduleData.length) return alert("Calculate first.");

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Loan EMI Summary"],
      [],
      ["Principal", summaryData.principal],
      ["EMI", summaryData.emi],
      ["Interest Rate", summaryData.rate + "%"],
      ["Total Months", summaryData.months],
      ["Total Interest Paid", summaryData.totalInterest],
      ["Total Paid Amount", summaryData.principal + summaryData.totalInterest]
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Schedule sheet
    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Month","Opening Principal","EMI","Principal Repaid","Interest","Closing Principal"],
      ...scheduleData.map(r => [
        r.month, r.opening, r.emi, r.principalRepaid, r.interest, r.closing
      ])
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    XLSX.writeFile(wb, `EMI_Schedule_${summaryData.principal}.xlsx`);
  });

  // ------------------------------------------------------
  // PDF DOWNLOAD
  // ------------------------------------------------------
  downloadPdfBtn.addEventListener("click", async () => {
    if (!scheduleData.length) return alert("Calculate first.");

    const target = document.getElementById("pdfContent");

    const canvas = await html2canvas(target);
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");

    const width = pdf.internal.pageSize.width - 40;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 20, 20, width, height);
    pdf.save(`EMI_Schedule_${summaryData.principal}.pdf`);
  });

  // ------------------------------------------------------
  // SIDEBAR COLLAPSE
  // ------------------------------------------------------
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

})();
