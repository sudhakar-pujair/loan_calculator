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

        // Add to table
        let row = `
            <tr>
                <td>${month}</td>
                <td>₹${balance.toFixed(2)}</td>
                <td>₹${EMI.toFixed(2)}</td>
                <td>₹${principalRepaid.toFixed(2)}</td>
                <td>₹${interest.toFixed(2)}</td>
                <td>₹${closingBalance.toFixed(2)}</td>
            </tr>
        `;
        tableBody.innerHTML += row;

        balance = closingBalance;
    }

    // Show output section
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("table_title").classList.remove("hidden");
    document.getElementById("scheduleTable").classList.remove("hidden");

    document.getElementById("r_principal").innerText = P.toLocaleString();
    document.getElementById("r_emi").innerText = EMI.toLocaleString();
    document.getElementById("r_rate").innerText = rate;
    document.getElementById("r_months").innerText = month;
    document.getElementById("r_interest").innerText = totalInterestPaid.toFixed(2).toLocaleString();
});
