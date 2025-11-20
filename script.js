// ----------------------------
// EMI Calculator (NO CHARTS)
// ----------------------------
(() => {

  const principalEl = document.getElementById('principal');
  const emiEl = document.getElementById('emi');
  const rateEl = document.getElementById('rate');

  const calculateBtn = document.getElementById('calculate');
  const downloadExcelBtn = document.getElementById('downloadExcel');
  const downloadPdfBtn = document.getElementById('downloadPdf');

  const errPrincipal = document.getElementById('errPrincipal');
  const errEmi = document.getElementById('errEmi');
  const errRate = document.getElementById('errRate');

  const r_principal = document.getElementById('r_principal');
  const r_emi = document.getElementById('r_emi');
  const r_rate = document.getElementById('r_rate');
  const r_months = document.getElementById('r_months');
  const r_interest = document.getElementById('r_interest');
  const r_total_paid = document.getElementById('r_total_paid');

  const scheduleTableBody = document.querySelector('#scheduleTable tbody');

  // ----------------------
  // Dark/Light theme
  // ----------------------
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const savedTheme = localStorage.getItem("theme") || "light";

  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.checked = savedTheme === "dark";
  themeLabel.innerText = savedTheme === "dark" ? "Dark" : "Light";

  themeToggle.addEventListener("change", () => {
    const mode = themeToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute('data-theme', mode);
    themeLabel.innerText = mode === "dark" ? "Dark" : "Light";
    localStorage.setItem("theme", mode);
  });

  // ----------------------
  // Validation
  // ----------------------
  function validate(P, EMI, rate) {
    let ok = true;

    errPrincipal.innerText = "";
    errEmi.innerText = "";
    errRate.innerText = "";

    if (!P || P <= 0) {
      errPrincipal.innerText = "Enter valid principal";
      ok = false;
    }

    if (!EMI || EMI <= 0) {
      errEmi.innerText = "Enter valid EMI";
      ok = false;
    }

    if (!rate || rate <= 0) {
      errRate.innerText = "Enter valid interest rate";
      ok = false;
    }

    return ok;
  }

  // ----------------------
  // Schedule Builder
  // ----------------------
  function buildSchedule(P, EMI, rate) {
    const mRate = rate / 12 / 100;

    let balance = P;
    let month = 0;

    const firstInterest = balance * mRate;
    if (EMI <= firstInterest) {
      throw new Error("EMI too low! First month interest is ₹" + firstInterest.toFixed(2));
    }

    const rows = [];
    let totalInterest = 0;
    let totalPrincipalPaid = 0;

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
        opening: Number(balance.toFixed(2)),
        emi: EMI,
        principalRepaid: Number(principalRepaid.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        closing: Number(closing.toFixed(2))
      });

      totalInterest += interest;
      totalPrincipalPaid += principalRepaid;
      balance = closing;
    }

    return {
      rows,
      months: rows.length,
      totalInterest: Number(totalInterest.toFixed(2)),
      totalPrincipalPaid: Number(totalPrincipalPaid.toFixed(2))
    };
  }

  // ----------------------
  // Render Summary
  // ----------------------
  function renderSummary(sum) {
    r_principal.innerText = "₹" + sum.principal.toLocaleString();
    r_emi.innerText = "₹" + sum.emi.toLocaleString();
    r_rate.innerText = sum.rate + "%";
    r_months.innerText = sum.months;
    r_interest.innerText = "₹" + sum.totalInterest.toLocaleString();

    // FIXED ✔ Total Paid = Principal + Interest
    const totalPaid = sum.principal + sum.totalInterest;
    r_total_paid.innerText = "₹" + totalPaid.toLocaleString();
  }

  // ----------------------
  // Render Table
  // ----------------------
  function renderTable(rows) {
    scheduleTableBody.innerHTML = "";
    rows.forEach(r => {
      scheduleTableBody.innerHTML += `
        <tr>
          <td>${r.month}</td>
          <td>₹${r.opening.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
          <td>₹${r.emi.toLocaleString()}</td>
          <td>₹${r.principalRepaid.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
          <td>₹${r.interest.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
          <td>₹${r.closing.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        </tr>
      `;
    });
  }

  // ----------------------
  // Calculate + Render
  // ----------------------
  let schedule = [];
  let summary = {};

  function calculate() {
    const P = Number(principalEl.value);
    const EMI = Number(emiEl.value);
    const rate = Number(rateEl.value);

    if (!validate(P, EMI, rate)) return;

    try {
      const out = buildSchedule(P, EMI, rate);

      schedule = out.rows;
      summary = {
        principal: P,
        emi: EMI,
        rate,
        months: out.months,
        totalInterest: out.totalInterest,
        totalPrincipalPaid: out.totalPrincipalPaid
      };

      renderSummary(summary);
      renderTable(schedule);

    } catch (err) {
      alert(err.message);
    }
  }

  calculateBtn.addEventListener("click", calculate);

  // ----------------------
  // Excel Download
  // ----------------------
  downloadExcelBtn.addEventListener("click", () => {
    if (!schedule.length) return alert("Please calculate first.");

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Loan EMI Summary"],
      [],
      ["Principal", summary.principal],
      ["EMI", summary.emi],
      ["Interest Rate", summary.rate + "%"],
      ["Total Months", summary.months],
      ["Total Interest Paid", summary.totalInterest],
      ["Total Paid Amount", summary.principal + summary.totalInterest]
    ]);

    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Month","Opening Principal","EMI","Principal Repaid","Interest","Closing Principal"],
      ...schedule.map(r => [
        r.month, r.opening, r.emi, r.principalRepaid, r.interest, r.closing
      ])
    ]);

    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    XLSX.writeFile(wb, `EMI_Schedule_${summary.principal}.xlsx`);
  });

  // ----------------------
  // PDF Download
  // ----------------------
  downloadPdfBtn.addEventListener("click", async () => {
    if (!schedule.length) return alert("Please calculate first.");

    const target = document.getElementById("pdfContent");
    const canvas = await html2canvas(target);
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');

    const pageWidth = pdf.internal.pageSize.width - 40;

    const scaledHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(img, "PNG", 20, 20, pageWidth, scaledHeight);
    pdf.save(`EMI_Schedule_${summary.principal}.pdf`);
  });

})();
