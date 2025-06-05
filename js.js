// In script.js

document.addEventListener('DOMContentLoaded', function() {
    let pieChart, lineChart, barChart;

    let activeStartDate = null;
    let activeEndDate = null;
    let activeVerificationType = 'all';
    let activeReportFrequency = 'daily'; // NEW state variable for frequency

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const verificationTypeInput = document.getElementById('verificationType');
    const reportFrequencyInput = document.getElementById('reportFrequency'); // NEW select element
    const applyFiltersBtn = document.getElementById('apply-filters-btn');

    const reportTableContainer = document.getElementById('reportTableContainer');

    // Centralized Raw Mock Data - This will be the single source of truth
    // Expanded data set to include entries from earlier in May
    const allRawReportData = [
        ["Report Date", "Verification Type", "Status", "Customer ID", "Processing Time (s)", "Device OS"], // Header row
        ["2025-05-10", "Identity", "Success", "CUST000", "2.1", "Android"],
        ["2025-05-12", "Address", "Success", "CUST000B", "3.0", "iOS"],
        ["2025-05-15", "Financial", "Error", "CUST000C", "4.5", "Android"],
        ["2025-05-16", "AML", "Pending", "CUST000D", "N/A", "Huawei HarmonyOS"],
        ["2025-05-18", "Identity", "Success", "CUST000E", "2.8", "iOS"],
        ["2025-05-20", "Address", "Error", "CUST000F", "3.2", "Android"],
        ["2025-05-22", "Financial", "Success", "CUST000G", "2.0", "iOS"],
        ["2025-05-25", "AML", "Success", "CUST000H", "4.0", "Android"],
        ["2025-05-28", "Identity", "Success", "CUST001", "2.5", "Android"],
        ["2025-05-28", "Address", "Error", "CUST002", "3.1", "iOS"],
        ["2025-05-29", "Identity", "Success", "CUST003", "1.8", "Android"],
        ["2025-05-29", "Financial", "Pending", "CUST004", "N/A", "Android"],
        ["2025-05-30", "Identity", "Success", "CUST005", "2.0", "iOS"],
        ["2025-05-30", "AML", "Success", "CUST006", "4.2", "Huawei HarmonyOS"],
        ["2025-05-28", "AML", "Success", "CUST007", "1.9", "Android"],
        ["2025-05-29", "Address", "Success", "CUST008", "2.7", "Huawei HarmonyOS"],
        ["2025-05-30", "Identity", "Error", "CUST009", "3.5", "iOS"],
        ["2025-06-01", "Financial", "Success", "CUST010", "2.1", "Android"],
        ["2025-06-02", "Identity", "Pending", "CUST011", "N/A", "Android"],
        ["2025-06-03", "AML", "Error", "CUST012", "4.0", "iOS"],
        ["2025-06-03", "Identity", "Success", "CUST013", "1.5", "Huawei HarmonyOS"]
    ];

    // Function to format date to YYYY-MM-DD for input fields
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Set default dates for the input fields to the last 7 days from current date
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    startDateInput.value = formatDate(sevenDaysAgo);
    endDateInput.value = formatDate(today);

    // Initialize active filters with the default values
    activeStartDate = startDateInput.value;
    activeEndDate = endDateInput.value;
    activeVerificationType = verificationTypeInput.value;
    activeReportFrequency = reportFrequencyInput.value; // Initialize frequency

    // --- Function to generate data for KPI cards and charts from filtered raw data ---
    function generateDashboardData(filteredRawData) {
        let totalVerifications = 0;
        let successfulVerifications = 0;
        let failedVerifications = 0;
        let newCustomers = 0;
        let pendingVerifications = 0;
        let totalProcessingTime = 0;
        let processingTimeCount = 0;

        // Aggregate KPIs from filtered raw data
        filteredRawData.forEach(row => {
            totalVerifications++;
            if (row[2] === 'Success') {
                successfulVerifications++;
            } else if (row[2] === 'Error') {
                failedVerifications++;
            }
            // For mock, we'll just sum up some random values for new customers and pending from the filtered set
            newCustomers += Math.floor(Math.random() * 5);
            if (row[2] === 'Pending') {
                pendingVerifications++;
            }

            const processingTime = parseFloat(row[4]);
            if (!isNaN(processingTime)) {
                totalProcessingTime += processingTime;
                processingTimeCount++;
            }
        });

        const avgProcessingTime = processingTimeCount > 0 ? `${(totalProcessingTime / processingTimeCount).toFixed(1)}s` : 'N/A';
        const successRate = totalVerifications > 0 ? ((successfulVerifications / totalVerifications) * 100).toFixed(2) : 0;
        const errorRate = totalVerifications > 0 ? (100 - parseFloat(successRate)).toFixed(2) : 0; // Corrected error rate calculation

        // --- Logic for CHART DATA BASED ON FREQUENCY ---
        const aggregatedChartData = {};

        filteredRawData.forEach(d => {
            const rowDate = new Date(d[0]); // Use the date from the raw data
            let key;

            if (activeReportFrequency === 'daily') {
                key = d[0]; // Already YYYY-MM-DD
            } else if (activeReportFrequency === 'weekly') {
                const startOfWeek = new Date(rowDate);
                startOfWeek.setDate(rowDate.getDate() - (rowDate.getDay() + 6) % 7); // Monday as start of week
                key = formatDate(startOfWeek) + ' to ' + formatDate(new Date(startOfWeek.setDate(startOfWeek.getDate() + 6)));
            } else if (activeReportFrequency === 'monthly') {
                key = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!aggregatedChartData[key]) {
                aggregatedChartData[key] = {
                    success: 0,
                    error: 0,
                    newCustomers: 0,
                    pending: 0,
                    failed: 0,
                };
            }
            if (d[2] === 'Success') {
                aggregatedChartData[key].success++;
            } else if (d[2] === 'Error') {
                aggregatedChartData[key].error++;
            }
            // Mocking these for chart consistency, in real data these would be aggregated from source
            aggregatedChartData[key].newCustomers += Math.floor(Math.random() * 5);
            if (d[2] === 'Pending') {
                aggregatedChartData[key].pending++;
            }
            // For failed, we'll just use the error count for simplicity in this mock
            aggregatedChartData[key].failed = aggregatedChartData[key].error;
        });

        // Convert aggregated object to sorted array for chart labels and data (Most recent first)
        const trendsForCharts = [];
        const dailyMetricsForCharts = [];

        Object.keys(aggregatedChartData).sort((a, b) => { // Sort keys in descending order
            // For date strings, direct comparison works for YYYY-MM-DD
            // For 'YYYY-MM' or 'YYYY-MM-DD to YYYY-MM-DD', direct string comparison for reverse order is fine
            return b.localeCompare(a);
        }).forEach(key => {
            const data = aggregatedChartData[key];
            trendsForCharts.push({
                date: key, // Use the aggregated period as the label
                success: data.success,
                error: data.error,
            });
            dailyMetricsForCharts.push({
                date: key, // Use the aggregated period as the label
                newCustomers: data.newCustomers,
                pending: data.pending,
                failed: data.failed,
            });
        });

        return {
            totalVerifications: totalVerifications,
            successRate: parseFloat(successRate),
            errorRate: parseFloat(errorRate),
            newCustomers: newCustomers,
            pendingVerifications: pendingVerifications,
            failedAttempts: failedVerifications, // Using failedVerifications for failed attempts KPI
            avgProcessingTime: avgProcessingTime,
            verificationTrends: trendsForCharts,
            dailyMetrics: dailyMetricsForCharts,
        };
    }

    let alerts = [];

    function renderAlerts() {
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = '';
        const alertCountSpan = document.getElementById('alert-count');

        if (alerts.length > 0) {
            alertCountSpan.classList.remove('d-none');
            alertCountSpan.textContent = alerts.length;
        } else {
            alertCountSpan.classList.add('d-none');
        }

        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert-custom ${alert.severity === 'critical' ? 'alert-critical' : alert.severity === 'warning' ? 'alert-warning' : 'alert-info'}`;
            alertDiv.setAttribute('data-alert-id', alert.id);

            let iconClass = '';
            if (alert.severity === 'critical') {
                iconClass = 'fas fa-exclamation-circle';
            } else if (alert.severity === 'warning') {
                iconClass = 'fas fa-bell';
            } else {
                iconClass = 'fas fa-info-circle';
            }

            alertDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="${iconClass} me-3"></i>
                    <p class="mb-0 fw-medium">${alert.message}</p>
                </div>
                <button type="button" class="alert-dismiss-btn" data-alert-id="${alert.id}">
                    Dismiss

                </button>
            `;
            alertsContainer.appendChild(alertDiv);
        });

        alertsContainer.querySelectorAll('.alert-dismiss-btn').forEach(button => {
            button.addEventListener('click', function() {
                const alertId = parseInt(this.getAttribute('data-alert-id'));
                alerts = alerts.filter(alert => alert.id !== alertId);
                renderAlerts();
            });
        });
    }

    function updateMetricCards(data) {
        document.getElementById('totalVerifications').textContent = data.totalVerifications.toLocaleString();
        document.getElementById('newCustomers').textContent = data.newCustomers.toLocaleString();
        document.getElementById('pendingVerifications').textContent = data.pendingVerifications.toLocaleString();
        document.getElementById('avgProcessingTime').textContent = data.avgProcessingTime;
    }

    function updateCharts(data) {
        // Function to apply cursor style to legend items
        const applyLegendCursor = (chartInstance) => {
            if (chartInstance && chartInstance.legend && chartInstance.legend.legendItems) {
                const legendContainer = chartInstance.legend.chart.canvas.parentNode.querySelector('.chartjs-legend');
                if (legendContainer) {
                    Array.from(legendContainer.querySelectorAll('li')).forEach(li => {
                        li.style.cursor = 'pointer';
                        const span = li.querySelector('span');
                        if (span) {
                            span.style.cursor = 'pointer';
                        }
                    });
                }
            }
        };

        const pieCtx = document.getElementById('pieChart').getContext('2d');
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Success', 'Error'],
                datasets: [{
                    data: [data.successRate, data.errorRate],
                    backgroundColor: ['#01377d', '#EF4444'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        afterUpdate: (chart) => applyLegendCursor(chart)
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        const lineCtx = document.getElementById('lineChart').getContext('2d');
        if (lineChart) lineChart.destroy();
        lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: data.verificationTrends.map(d => d.date),
                datasets: [
                    {
                        label: 'Successful Verifications',
                        data: data.verificationTrends.map(d => d.success),
                        borderColor: '#01377d',
                        backgroundColor: 'rgba(1, 55, 125, 0.2)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Failed Verifications',
                        data: data.verificationTrends.map(d => d.error),
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        afterUpdate: (chart) => applyLegendCursor(chart)
                    },
                    title: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        beginAtZero: false,
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const barCtx = document.getElementById('barChart').getContext('2d');
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: data.dailyMetrics.map(d => d.date),
                datasets: [
                    {
                        label: 'New Customers',
                        data: data.dailyMetrics.map(d => d.newCustomers),
                        backgroundColor: '#01377d',
                    },
                    {
                        label: 'Pending',
                        data: data.dailyMetrics.map(d => d.pending),
                        backgroundColor: '#ffd100',
                    },
                    {
                        label: 'Failed',
                        data: data.dailyMetrics.map(d => d.failed),
                        backgroundColor: '#ef4444',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        afterUpdate: (chart) => applyLegendCursor(chart)
                    },
                    title: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // --- Main update function (renamed to renderDashboard for clarity) ---
    function renderDashboard() {
        console.log('renderDashboard called'); // Debugging log

        // Filter the raw data first based on current active filters
        const filterStartDate = new Date(activeStartDate);
        const filterEndDate = new Date(activeEndDate);
        const filterType = activeVerificationType;

        const adjustedFilterEndDate = new Date(filterEndDate);
        adjustedFilterEndDate.setHours(23, 59, 59, 999);

        const filteredRawData = allRawReportData.slice(1).filter(row => { // Exclude header for filtering
            const rowDate = new Date(row[0]);
            const rowType = row[1].toLowerCase();

            const isDateMatch = rowDate >= filterStartDate && rowDate <= adjustedFilterEndDate;
            const isTypeMatch = filterType === 'all' || rowType === filterType.toLowerCase();

            return isDateMatch && isTypeMatch;
        });

        // Generate data for KPIs and Charts from the filtered raw data
        const dashboardData = generateDashboardData(filteredRawData);
        updateMetricCards(dashboardData);
        updateCharts(dashboardData);

        // Update Data Freshness Indicator
        const now = new Date();
        document.getElementById('dataFreshness').textContent = now.toLocaleString();

        // Alerts logic
        if (dashboardData.errorRate > 10 && !alerts.some(a => a.type === 'error-rate')) {
            alerts.push({
                id: Date.now(),
                type: 'error-rate',
                message: `Critical: High Error Rate Detected: ${dashboardData.errorRate}%!`,
                severity: 'critical',
            });
        } else if (dashboardData.errorRate <= 10) {
            alerts = alerts.filter(a => a.type !== 'error-rate');
        }

        if (dashboardData.pendingVerifications > 20 && !alerts.some(a => a.type === 'pending-verifications')) {
            alerts.push({
                id: Date.now() + 1,
                type: 'pending-verifications',
                message: `Warning: Increased Pending Verifications: ${dashboardData.pendingVerifications}`,
                severity: 'warning',
            });
        } else if (dashboardData.pendingVerifications <= 20) {
            alerts = alerts.filter(a => a.type !== 'pending-verifications');
        }

        renderAlerts();
    }

    // --- Event Listener for Apply Filters button ---
    applyFiltersBtn.addEventListener('click', function() {
        console.log('Apply Filters button clicked!'); // Debugging log

        const newStartDate = startDateInput.value;
        const newEndDate = endDateInput.value;
        const newVerificationType = verificationTypeInput.value;
        const newReportFrequency = reportFrequencyInput.value; // Get new frequency

        console.log('New Start Date:', newStartDate); // Debugging log
        console.log('New End Date:', newEndDate);     // Debugging log
        console.log('New Verification Type:', newVerificationType); // Debugging log
        console.log('New Report Frequency:', newReportFrequency); // Debugging log

        if (!newStartDate || !newEndDate || new Date(newStartDate) > new Date(newEndDate)) {
            alert('Please select valid start and end dates where the start date is not after the end date.');
            return;
        }
        // Validate end date against current date
        const selectedEndDateForValidation = new Date(newEndDate);
        const todayForValidation = new Date();
        todayForValidation.setHours(0, 0, 0, 0);
        selectedEndDateForValidation.setHours(0, 0, 0, 0);

        if (selectedEndDateForValidation > todayForValidation) {
            alert('The end date cannot be in the future. Please select a date up to today.');
            // Do not proceed with applying filters if the date is invalid
            return;
        }


        activeStartDate = newStartDate;
        activeEndDate = newEndDate;
        activeVerificationType = newVerificationType;
        activeReportFrequency = newReportFrequency; // Update active frequency

        renderDashboard(); // Re-render charts and KPIs with new frequency
        displayCustomReportTable(); // Re-render table with new frequency
    });

    // Function to aggregate data by day, week, or month
    function aggregateData(dataRows, frequency) {
        const aggregated = {}; // Key: date/week/month, Value: {success: 0, error: 0, total: 0}

        dataRows.forEach(row => {
            const rowDate = new Date(row[0]);
            let key;

            if (frequency === 'daily') {
                key = row[0]; // Already YYYY-MM-DD
            } else if (frequency === 'weekly') {
                const startOfWeek = new Date(rowDate);
                startOfWeek.setDate(rowDate.getDate() - (rowDate.getDay() + 6) % 7); // Monday as start of week
                key = formatDate(startOfWeek) + ' to ' + formatDate(new Date(startOfWeek.setDate(startOfWeek.getDate() + 6)));
            } else if (frequency === 'monthly') {
                key = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!aggregated[key]) {
                aggregated[key] = {
                    total: 0,
                    success: 0,
                    error: 0,
                };
            }

            aggregated[key].total++;
            if (row[2] === 'Success') { // Status column
                aggregated[key].success++;
            } else if (row[2] === 'Error') {
                aggregated[key].error++;
            }
        });

        // Convert aggregated object back to an array of arrays for table display
        const aggregatedArray = [];
        // Header for aggregated report
        let header = ["Period", "Total Verifications", "Successful", "Failed", "Success Rate (%)", "Error Rate (%)"];
        aggregatedArray.push(header);

        Object.keys(aggregated).sort((a, b) => b.localeCompare(a)).forEach(key => { // Sort keys in descending order
            const data = aggregated[key];
            const successRate = data.total > 0 ? ((data.success / data.total) * 100).toFixed(2) : 0;
            const errorRate = data.total > 0 ? ((data.error / data.total) * 100).toFixed(2) : 0;
            aggregatedArray.push([
                key,
                data.total,
                data.success,
                data.error,
                successRate,
                errorRate
            ]);
        });
        return aggregatedArray;
    }


    // Function to export the currently displayed table data
    function exportFilteredTable() {
        const table = document.querySelector('#reportTableContainer table');
        if (!table) {
            alert('No report table found to export.');
            return;
        }

        let csv = [];
        const rows = table.querySelectorAll('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');
            for (let j = 0; j < cols.length; j++) {
                // Sanitize content for CSV, handle commas and quotes
                let data = cols[j].innerText.replace(/"/g, '""');
                row.push(`"${data}"`);
            }
            csv.push(row.join(','));
        }

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `KYC_Filtered_Report_${activeReportFrequency}_${activeStartDate}_to_${activeEndDate}.csv`;

        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert(`Report "${fileName}" has been generated and downloaded!`);
        } else {
            alert('Your browser does not support automatic downloads. Here is your report data:\n\n' + csvContent);
        }
    }


    // Function to display report as a table on the page (NOW WITH FILTERING AND AGGREGATION)
    function displayCustomReportTable() {
        console.log('displayCustomReportTable called'); // Debugging log

        // Get filter values
        const filterStartDate = new Date(activeStartDate);
        const filterEndDate = new Date(activeEndDate);
        const filterType = activeVerificationType;
        const filterFrequency = activeReportFrequency;

        // Ensure date comparison includes the entire day for endDate
        const adjustedFilterEndDate = new Date(filterEndDate);
        adjustedFilterEndDate.setHours(23, 59, 59, 999);


        // Filter the data rows (excluding the header row for filtering logic)
        // Use the global allRawReportData here
        let filteredDataRows = allRawReportData.slice(1).filter(row => {
            const rowDate = new Date(row[0]); // Column 0 is "Report Date"
            const rowType = row[1].toLowerCase(); // Column 1 is "Verification Type"
            const rowOS = row[5] ? row[5].toLowerCase() : ''; // Column 5 is "Device OS" (handle potential undefined)

            const isDateMatch = rowDate >= filterStartDate && rowDate <= adjustedFilterEndDate;
            const isTypeMatch = filterType === 'all' || rowType === filterType.toLowerCase();

            return isDateMatch && isTypeMatch;
        });

        // Sort filteredDataRows by date in descending order (most recent first)
        filteredDataRows.sort((a, b) => new Date(b[0]) - new Date(a[0]));


        let reportDataToDisplay;

        if (filterFrequency === 'daily') {
            reportDataToDisplay = [allRawReportData[0], ...filteredDataRows]; // Use global header
        } else {
            reportDataToDisplay = aggregateData(filteredDataRows, filterFrequency);
        }

        let tableHtml = '<table class="table table-striped table-hover">';
        // Table Header
        tableHtml += '<thead><tr>';
        reportDataToDisplay[0].forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';

        // Table Body
        tableHtml += '<tbody>';
        // Loop from index 1 to skip the header row when generating table body content
        if (reportDataToDisplay.length > 1) { // Check if there are data rows besides the header
            for (let i = 1; i < reportDataToDisplay.length; i++) {
                tableHtml += '<tr>';
                reportDataToDisplay[i].forEach(cell => {
                    let cellHtml = `<td>${cell}</td>`; // Declare cellHtml here
                    tableHtml += cellHtml;
                });
                tableHtml += '</tr>';
            }
        } else {
            tableHtml += '<tr><td colspan="' + allRawReportData[0].length + '">No data available for the selected filters.</td></tr>';
        }
        tableHtml += '</tbody>';
        tableHtml += '</table>';

        reportTableContainer.innerHTML = tableHtml;
    }

    function viewAuditLogs() {
        alert('Displaying audit logs... (This would normally load a detailed log viewer)');
    }

    function showAuditSupportDocumentation() {
        alert('Opening audit support documentation... (e.g., Compliance Guide, API Documentation)');
    }

    // Event listeners for report and audit buttons
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportFilteredTable);
    }

    const viewAuditLogsBtn = document.getElementById('viewAuditLogsBtn');
    if (viewAuditLogsBtn) {
        viewAuditLogsBtn.addEventListener('click', viewAuditLogs);
    }

    const auditSupportDocBtn = document.getElementById('auditSupportDocBtn');
    if (auditSupportDocBtn) {
        auditSupportDocBtn.addEventListener('click', showAuditSupportDocumentation);
    }

    // Initial dashboard load
    renderDashboard();
    displayCustomReportTable();

    // Event listener for endDate input to prevent exceeding current date
    endDateInput.addEventListener('change', function() {
        const selectedEndDate = new Date(this.value);
        const today = new Date();
        // Set hours, minutes, seconds, milliseconds to 0 for accurate date comparison
        today.setHours(0, 0, 0, 0);
        selectedEndDate.setHours(0, 0, 0, 0);

        if (selectedEndDate > today) {
            alert('The end date cannot be in the future. Please select a date up to today.');
            this.value = formatDate(new Date()); // Reset to today's date
        }
    });
});
