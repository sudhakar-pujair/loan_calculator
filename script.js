// EMI Calculator — premium UI script
(() => {
  // Elements
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

  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const collapseBtnIcon = toggleSidebarBtn.querySelector('i');
  const inputCard = document.getElementById('inputCard');
  const toggleInputCard = document.getElementById('toggleInputCard');
  const summaryItems = document.querySelectorAll('[data-anim]');

  // Mobile detection
  function isMobile() { return window.matchMedia("(max-width:900px)").matches; }

  // Theme: default dark; stored in localStorage
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  // Apply theme by toggling a data-attribute on <html> if needed (kept simple)
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
    themeLabel.innerText = 'Dark';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.checked = false;
    themeLabel.innerText = 'Light';
  }
  themeToggle.addEventListener('change', () => {
    const mode = themeToggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
    themeLabel.innerText = mode === 'dark' ? 'Dark' : 'Light';
  });

  // Sidebar initial state: on mobile hidden, desktop shown
  function initSidebarState() {
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('open');
    } else {
      // desktop: not open (normal), but NOT collapsed by default
      sidebar.classList.remove('open');
      // keep expanded
    }
  }
  initSidebarState();

  // Toggle sidebar (floating button)
  let sidebarCollapsed = false;
  toggleSidebarBtn.addEventListener('click', () => {
    // Mobile: toggle overlay open/close
    if (isMobile()) {
      sidebar.classList.toggle('open');
      return;
    }
    // Desktop: collapse/uncollapse
    sidebarCollapsed = !sidebarCollapsed;
    if (sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      collapseBtnIcon.style.transform = 'rotate(90deg)';
    } else {
      sidebar.classList.remove('collapsed');
      collapseBtnIcon.style.transform = 'rotate(0deg)';
    }
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (isMobile()) {
      if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Toggle input card (expand/collapse)
  toggleInputCard && toggleInputCard.addEventListener('click', () => {
    if (!inputCard) return;
    inputCard.classList.toggle('collapsed');
    const icon = toggleInputCard.querySelector('i');
    if (inputCard.classList.contains('collapsed')) {
      inputCard.style.maxHeight = '0';
      inputCard.style.opacity = '0';
      icon.style.transform = 'rotate(-90deg)';
    } else {
      inputCard.style.maxHeight = '1000px';
      inputCard.style.opacity = '1';
      icon.style.transform = 'rotate(0deg)';
    }
  });

  // Animate summary cards entrance
  function showSummaryAnim() {
    summaryItems.forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), 80 * i);
    });
  }
  showSummaryAnim();

  // Validate inputs
  function validate(P, EMI, rate) {
    if (!P || P <= 0) { alert('Please enter valid Principal'); return false; }
    if (!EMI || EMI <= 0) { alert('Please enter valid EMI'); return false; }
    if (!rate || rate <= 0) { alert('Please enter valid Interest Rate'); return false; }
    return true;
  }

  // Build schedule
  function buildSchedule(P, EMI, rate) {
    const monthlyRate = rate / 12 / 100;
    let balance = P;
    let month = 0;
    let totalInterest = 0;
    const rows = [];

    const firstInterest = balance * monthlyRate;
    if (EMI <= firstInterest) throw new Error('EMI too low! First month interest: ₹' + firstInterest.toFixed(2));

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
        emi: Number(EMI.toFixed(2)),
        principalRepaid: Number(principalRepaid.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        closing: Number(closing.toFixed(2))
      });
      totalInterest += interest;
      balance = closing;
    }
    return { rows, months: rows.length, totalInterest: Number(totalInterest.toFixed(2)) };
  }

  // Render summary
  function renderSummary(s) {
    r_principal.innerText = '₹' + s.principal.toLocaleString();
    r_emi.innerText = '₹' + s.emi.toLocaleString();
    r_rate.innerText = s.rate + '%';
    r_months.innerText = s.months;
    r_interest.innerText = '₹' + s.totalInterest.toLocaleString();
    r_total_paid.innerText = '₹' + (s.principal + s.totalInterest).toLocaleString();
  }

  // Render table
  function renderTable(rows) {
    tableBody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.month}</td>
        <td>₹${r.opening.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        <td>₹${r.emi.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        <td>₹${r.principalRepaid.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        <td>₹${r.interest.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        <td>₹${r.closing.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // State
  let scheduleData = [];
  let summaryData = {};

  // Calculate handler
  calculateBtn.addEventListener('click', () => {
    const P = Number(principalEl.value);
    const EMI = Number(emiEl.value);
    const rate = Number(rateEl.value);
    if (!validate(P, EMI, rate)) return;
    try {
      const out = buildSchedule(P, EMI, rate);
      scheduleData = out.rows;
      summaryData = { principal: P, emi: EMI, rate, months: out.months, totalInterest: out.totalInterest };
      renderSummary(summaryData);
      renderTable(scheduleData);
      // animate cards quickly
      summaryItems.forEach(el => { el.classList.remove('show'); setTimeout(()=>el.classList.add('show'), 10); });
    } catch (err) {
      alert(err.message);
    }
  });

  // Excel export
  excelBtn.addEventListener('click', () => {
    if (!scheduleData.length) return alert('Please calculate first.');
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Loan EMI Summary'],[],
      ['Principal', summaryData.principal],
      ['EMI', summaryData.emi],
      ['Interest Rate', summaryData.rate + '%'],
      ['Total Months', summaryData.months],
      ['Total Interest Paid', summaryData.totalInterest],
      ['Total Paid Amount', summaryData.principal + summaryData.totalInterest]
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Month','Opening Principal','EMI','Principal Repaid','Interest','Closing Principal'],
      ...scheduleData.map(r => [r.month, r.opening, r.emi, r.principalRepaid, r.interest, r.closing])
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Schedule');
    XLSX.writeFile(wb, `EMI_Schedule_${summaryData.principal}.xlsx`);
  });

  // PDF export
  pdfBtn.addEventListener('click', async () => {
    if (!scheduleData.length) return alert('Please calculate first.');
    const target = document.getElementById('pdfContent');
    const canvas = await html2canvas(target, { scale: 2 });
    const img = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const width = pdf.internal.pageSize.width - 40;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, 'PNG', 20, 20, width, height);
    pdf.save(`EMI_Schedule_${summaryData.principal}.pdf`);
  });

  // Accessibility: allow Enter to calculate when focused in inputs
  [principalEl, emiEl, rateEl].forEach(el => {
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calculateBtn.click(); } });
  });

  // Window resize: if mobile, ensure sidebar closed by default
  window.addEventListener('resize', () => {
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('open');
    }
  });

  // Keyboard accessible toggle: collapse with 'C'
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd + C toggles sidebar on desktop
      sidebar.classList.toggle('collapsed');
    }
  });

})();
