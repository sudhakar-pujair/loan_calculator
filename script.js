let globalSchedule = [];
let globalPrincipal = 0;
let globalEMI = 0;
let globalRate = 0;
let globalMonths = 0;
let globalTotalInterest = 0;

document.getElementById("emiForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const P = parseFloat(document.getElementById("principal").value);
    const EMI = parseFloat(document.getElementById("emi").value);
    const rate = parseFloat(document.getElementById("rate").value);

    let balance = P;
    let month = 0;
    const monthlyRate = rate / 12 / 100;

    const firstInterest = balance * monthlyRate;
    if (EMI <= firstInterest) {
        alert("❌ EMI is too low. Increase EMI.");
        return;
    }

    let tableBody = document.querySelector("#scheduleTable tbody");
    tableBody.innerHTML = "";

    let totalInterestPaid = 0;
    let schedule = [];

    while (balance > 0) {
        month++;
        let interest = balance * monthlyRate;
        let principalRepaid = EMI - interest;
        let closingBalance = balance - principalRepaid;

        if (closingBalance < 0) {
            principalRepaid = balance;
            closingBalance = 0;
        }

        totalInterestPaid += interest;

        let row = [
            month,
            balance.toFixed(2),
            EMI.toFixed(2),
            principalRepaid.toFixed(2),
            interest.toFixed(2),
            closingBalance.toFixed(2)
        ];

        schedule.push(row);

        // Add row to table
        let htmlRow = `
            <tr>
                <td>${row[0]}</td>
                <td>₹${row[1]}</td>
                <td>₹${row[2]}</td>
                <td>₹${row[3]}</td>
                <td>₹${row[4]}</td>
                <td>₹${row[5]}</td>
            </tr>
        `;
        tableBody.innerHTML += htmlRow;

        balance = closingBalance;
    }

    // Save values globally for Excel
    globalSchedule = schedule;
    globalPrincipal = P;
    globalEMI = EMI;
    globalRate = rate;
    globalMonths = month;
    globalTotalInterest = totalInterestPaid;

    // Show sections
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("table_title").classList.remove("hidden");
    document.getElementById("scheduleTable").classList.remove("hidden");

    // Show summary
    document.getElementById("r_principal").innerText = P.toLocaleString();
    document.getElementById("r_emi").innerText = EMI.toLocaleString();
    document.getElementById("r_rate").innerText = rate;
    document.getElementById("r_months").innerText = month;
    document.getElementById("r_interest").innerText = totalInterestPaid.toFixed(2).toLocaleString();
});


/* -------------------------
   DOWNLOAD EXCEL
-------------------------- */
document.getElementById("downloadExcel").addEventListener("click", function () {

    let wb = XLSX.utils.book_new();

    /* SUMMARY SHEET */
    let summaryData = [
        ["Principal", `₹${globalPrincipal.toLocaleString()}`],
        ["EMI", `₹${globalEMI.toLocaleString()}`],
        ["Interest Rate", `${globalRate}%`],
        ["Total Months", globalMonths],
        ["Total Interest Paid", `₹${globalTotalInterest.toFixed(2)}`]
    ];

    let ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    /* SCHEDULE SHEET */
    let header = [
        ["Month", "Opening Principal", "EMI", "Principal Repaid", "Interest", "Closing Principal"]
    ];

    let data = header.concat(globalSchedule);

    let ws2 = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    /* SAVE FILE */
    XLSX.writeFile(wb, `EMI_Schedule_${globalPrincipal}.xlsx`);
});
