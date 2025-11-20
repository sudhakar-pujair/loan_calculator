let globalSchedule = [];
let globalPrincipal = 0;
let globalEMI = 0;
let globalRate = 0;
let globalMonths = 0;
let globalTotalInterest = 0;

/* ==========================================================
   EMI CALCULATION
========================================================== */
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

    // Save globally
    globalSchedule = schedule;
    globalPrincipal = P;
    globalEMI = EMI;
    globalRate = rate;
    globalMonths = month;
    globalTotalInterest = totalInterestPaid;

    document.getElementById("result").classList.remove("hidden");
    document.getElementById("table_title").classList.remove("hidden");
    document.getElementById("scheduleTable").classList.remove("hidden");

    document.getElementById("r_principal").innerText = P.toLocaleString();
    document.getElementById("r_emi").innerText = EMI.toLocaleString();
    document.getElementById("r_rate").innerText = rate;
    document.getElementById("r_months").innerText = month;
    document.getElementById("r_interest").innerText = totalInterestPaid.toFixed(2).toLocaleString();
});


/* ==========================================================
   EXCEL DOWNLOAD + STYLING
========================================================== */
document.getElementById("downloadExcel").addEventListener("click", function () {

    let wb = XLSX.utils.book_new();

    /* -------------------------
       SUMMARY SHEET
    -------------------------- */
    let summaryData = [
        ["Loan EMI Summary"],
        [],
        ["Principal", globalPrincipal],
        ["EMI", globalEMI],
        ["Interest Rate", `${globalRate}%`],
        ["Total Months", globalMonths],
        ["Total Interest Paid", globalTotalInterest.toFixed(2)]
    ];

    let ws1 = XLSX.utils.aoa_to_sheet(summaryData);

    ws1["A1"].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };

    for (let i = 3; i <= 7; i++) {
        ws1[`A${i}`].s = { font: { bold: true, sz: 12 } };
    }

    ws1["B3"].s = { numFmt: "₹#,##0.00" };
    ws1["B4"].s = { numFmt: "₹#,##0.00" };
    ws1["B7"].s = { numFmt: "₹#,##0.00" };

    XLSX.utils.book_append_sheet(wb, ws1, "Summary");


    /* -------------------------
       SCHEDULE SHEET
    -------------------------- */
    let header = [
        ["Month", "Opening Principal", "EMI", "Principal Repaid", "Interest", "Closing Principal"]
    ];

    let data = header.concat(globalSchedule);
    let ws2 = XLSX.utils.aoa_to_sheet(data);

    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" },
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    ["A", "B", "C", "D", "E", "F"].forEach(col => ws2[col + "1"].s = headerStyle);

    const moneyCell = {
        alignment: { horizontal: "right" },
        numFmt: "₹#,##0.00",
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    const numberCell = {
        alignment: { horizontal: "center" },
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    for (let r = 2; r <= data.length; r++) {
        ws2[`A${r}`].s = numberCell;

        ["B", "C", "D", "E", "F"].forEach(col => {
            ws2[`${col}${r}`].s = moneyCell;
        });
    }

    ws2["!cols"] = [
        { wpx: 70 },
        { wpx: 150 },
        { wpx: 100 },
        { wpx: 150 },
        { wpx: 100 },
        { wpx: 150 }
    ];

    XLSX.utils.book_append_sheet(wb, ws2, "Schedule");

    XLSX.writeFile(wb, `EMI_Schedule_${globalPrincipal}.xlsx`);
});
