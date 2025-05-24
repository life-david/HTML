'use strict'; // Bật chế độ nghiêm ngặt

// --- Biến toàn cục cho biểu đồ và cấu hình ---
let cpuChart, ramChart;
const MAX_DATA_POINTS = 30; // Số điểm dữ liệu trên biểu đồ
const UPDATE_INTERVAL = 1500; // Thời gian cập nhật (ms), ví dụ 1.5 giây

// --- Hàm khởi tạo biểu đồ ---
function initializeCharts() {
    const cpuCtx = document.getElementById('cpu-chart')?.getContext('2d');
    const ramCtx = document.getElementById('ram-chart')?.getContext('2d');

    const commonChartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: { 
                    stepSize: 25,
                    font: { size: 10 } // Font nhỏ hơn cho trục Y
                }
            },
            x: {
                ticks: { display: false } // Ẩn nhãn trục X
            }
        },
        animation: { duration: 300, easing: 'linear' }, // Animation nhẹ nhàng hơn
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false } // Tắt tooltip mặc định cho gọn
        },
        maintainAspectRatio: false, // Cho phép thay đổi tỷ lệ
        elements: {
            line: {
                tension: 0.3, // Đường cong mượt hơn
                borderWidth: 2 // Độ dày đường line
            },
            point: {
                radius: 0 // Ẩn điểm dữ liệu
            }
        }
    };

    if (cpuCtx) {
        cpuChart = new Chart(cpuCtx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: 'rgb(75, 192, 192)' }] },
            options: commonChartOptions
        });
    }

    if (ramCtx) {
        ramChart = new Chart(ramCtx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], borderColor: 'rgb(54, 162, 235)' }] }, // Màu xanh dương Bootstrap
            options: commonChartOptions
        });
    }
}

// --- Hàm cập nhật dữ liệu biểu đồ ---
function updateChartData(chart, newData) {
    if (!chart || typeof newData !== 'number') return; // Chỉ cập nhật nếu có chart và dữ liệu là số

    const labels = chart.data.labels;
    const data = chart.data.datasets[0].data;

    // Thêm dữ liệu mới
    labels.push(''); // Không cần hiển thị nhãn thời gian cụ thể trên trục X nữa
    data.push(newData.toFixed(1));

    // Giới hạn số điểm
    if (labels.length > MAX_DATA_POINTS) {
        labels.shift();
        data.shift();
    }

    chart.update(); // Cập nhật biểu đồ
}

// --- Hàm cập nhật màu và text cho Progress Bar (Bootstrap) ---
function updateProgressBar(elementId, textElementId, percentage) {
    const progressBar = document.getElementById(elementId);
    const textElement = document.getElementById(textElementId);
    if (!progressBar || !textElement) return;

    // Xử lý trường hợp dữ liệu không phải số (ví dụ: disk N/A)
    if (typeof percentage !== 'number') {
        progressBar.style.width = '0%';
        progressBar.classList.remove('bg-success', 'bg-info', 'bg-warning', 'bg-danger');
        progressBar.classList.add('bg-secondary'); // Màu xám cho N/A
        textElement.textContent = 'N/A';
        progressBar.closest('.progress')?.setAttribute('aria-valuenow', 0);
        return;
    }
    
    const percent = percentage.toFixed(1);
    progressBar.style.width = percent + '%';
    textElement.textContent = percent + '%';
    progressBar.closest('.progress')?.setAttribute('aria-valuenow', percent);

    // Cập nhật màu nền
    progressBar.classList.remove('bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-secondary');
    if (elementId === 'disk-progress') { // Disk dùng thang màu riêng
         if (percentage > 90) progressBar.classList.add('bg-danger');
         else if (percentage > 75) progressBar.classList.add('bg-warning');
         else progressBar.classList.add('bg-primary'); // Màu xanh dương cho disk < 75%
    } else if (elementId === 'mem-progress') { // RAM dùng thang màu riêng
         if (percentage > 85) progressBar.classList.add('bg-danger');
         else if (percentage > 70) progressBar.classList.add('bg-warning');
         else progressBar.classList.add('bg-info'); // Màu xanh dương nhạt cho RAM
    }
    else { // CPU hoặc mặc định
        if (percentage > 85) progressBar.classList.add('bg-danger');
        else if (percentage > 65) progressBar.classList.add('bg-warning');
        else progressBar.classList.add('bg-success'); // Xanh lá
    }
}

// --- Hàm cập nhật toàn bộ giao diện ---
function updateUI(stats) {
    // Cập nhật nhiệt độ CPU
    const cpuTempDisplay = document.getElementById('cpu-temp-display');
    if (stats.temperatures && stats.temperatures.cpu !== undefined) {
        cpuTempDisplay.textContent = `${stats.temperatures.cpu} °C`;
    } else {
        cpuTempDisplay.textContent = 'N/A';
    }

    // Cập nhật tốc độ quạt CPU
    const cpuFanSpeedDisplay = document.getElementById('cpu-fan-speed-display');
    if (stats.fan_speeds && stats.fan_speeds.cpu !== undefined) {
        cpuFanSpeedDisplay.textContent = `${stats.fan_speeds.cpu} RPM`;
    } else {
        cpuFanSpeedDisplay.textContent = 'N/A';
    }

    // Cập nhật các thành phần khác (CPU, RAM, Disk, v.v.)
    updateProgressBar('cpu-progress', 'cpu-usage-bar-text', stats.cpu_usage);
    updateChartData(cpuChart, stats.cpu_usage);
    updateProgressBar('mem-progress', 'mem-usage-bar-text', stats.memory.percent);
    updateChartData(ramChart, stats.memory.percent);
    updateProgressBar('disk-progress', 'disk-usage-bar-text', stats.disk.percent);
    document.getElementById('mem-used').textContent = stats.memory.used_gb || '--';
    document.getElementById('mem-total').textContent = stats.memory.total_gb || '--';
    document.getElementById('disk-used').textContent = stats.disk.used_gb || '--';
    document.getElementById('disk-total').textContent = stats.disk.total_gb || '--';
    document.getElementById('cpu-temp').textContent = stats.temperature.cpu_temp || '--';
}

// --- Hàm cập nhật bảng tiến trình ---
function updateProcessTable(processes) {
    const tableBody = document.getElementById('process-table-body');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    processes.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${process.cpu_percent}</td>
            <td>${process.memory_mb}</td>
            <td>
                <button class="btn btn-danger btn-sm" id="action-btn-${process.pid}" onclick="handleProcessAction(${process.pid}, this)">Dừng</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function handleProcessAction(pid, button) {
    if (button.textContent === 'Dừng') {
        // Gọi API dừng tiến trình
        fetch('/api/process/terminate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid: pid })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Hiển thị thông báo
            if (data.status === 'success') {
                // Chuyển nút thành "Khởi động lại"
                button.textContent = 'Khởi động lại';
                button.classList.remove('btn-danger');
                button.classList.add('btn-warning');
            }
        })
        .catch(error => console.error('Error:', error));
    } else if (button.textContent === 'Khởi động lại') {
        // Gọi API khởi động lại tiến trình
        fetch('/api/process/restart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid: pid })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Hiển thị thông báo
            if (data.status === 'success') {
                // Chuyển nút thành "Dừng"
                button.textContent = 'Dừng';
                button.classList.remove('btn-warning');
                button.classList.add('btn-danger');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// --- Hàm cập nhật bảng ứng dụng ---
function updateAppTable(apps) {
    const tableBody = document.getElementById('app-table-body');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    apps.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.pid}</td>
            <td>${app.name}</td>
            <td>${app.status}</td>
            <td>${app.icon}</td> <!-- Hiển thị biểu tượng -->
        `;
        tableBody.appendChild(row);
    });
}

// --- Hàm lấy danh sách ứng dụng từ API ---
function fetchRunningApps() {
    fetch('/api/running_apps')
        .then(response => response.json())
        .then(data => {
            updateAppTable(data);
        })
        .catch(error => console.error('Error fetching running apps:', error));
}

// --- Hàm lấy dữ liệu từ API ---
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        console.log('Stats:', stats); // Log để kiểm tra
        updateUI(stats);
    } catch (error) {
        console.error("Failed to fetch system stats:", error);
    }
}

// --- Hàm hiển thị chi tiết ---
function showDetails(section) {
    // Ẩn tất cả các khu vực chi tiết
    document.querySelectorAll('.details-section').forEach(section => {
        section.style.display = 'none';
    });

    // Hiển thị khu vực chi tiết được chọn
    const sectionId = `${section}-details`;
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }

    // Tải dữ liệu và cập nhật biểu đồ
    if (section === 'cpu') {
        updateCpuChartLarge();
    } else if (section === 'memory') {
        updateMemoryChartLarge();
    } else if (section === 'disk') {
        updateDiskChartLarge();
    }
}

function updateCpuChartLarge() {
    // Logic để cập nhật biểu đồ CPU lớn
    const ctx = document.getElementById('cpu-chart-large').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1s', '2s', '3s', '4s', '5s'],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [10, 20, 30, 40, 50],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateMemoryChartLarge() {
    // Logic để cập nhật biểu đồ Memory lớn
    const ctx = document.getElementById('memory-chart-large').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Used', 'Free'],
            datasets: [{
                label: 'Memory (GB)',
                data: [8, 24], // Thay bằng dữ liệu thực tế
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateDiskChartLarge() {
    // Logic để cập nhật biểu đồ Disk lớn
    const ctx = document.getElementById('disk-chart-large').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Used', 'Free'],
            datasets: [{
                label: 'Disk Usage',
                data: [500, 1500], // Thay bằng dữ liệu thực tế
                backgroundColor: ['rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

function showModal(section) {
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('chartModal'));
    modal.show();

    // Cập nhật tiêu đề modal
    const modalTitle = document.getElementById('chartModalLabel');
    modalTitle.textContent = `${section.toUpperCase()} Usage`;

    // Cập nhật biểu đồ trong modal
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    let chartData = {};
    let chartType = 'line';

    if (section === 'cpu') {
        chartData = {
            labels: ['1s', '2s', '3s', '4s', '5s'],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [10, 20, 30, 40, 50], // Thay bằng dữ liệu thực tế
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        };
    } else if (section === 'memory') {
        chartType = 'bar';
        chartData = {
            labels: ['Used', 'Free'],
            datasets: [{
                label: 'Memory (GB)',
                data: [8, 24], // Thay bằng dữ liệu thực tế
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }]
        };
    } else if (section === 'disk') {
        chartType = 'doughnut';
        chartData = {
            labels: ['Used', 'Free'],
            datasets: [{
                label: 'Disk Usage',
                data: [500, 1500], // Thay bằng dữ liệu thực tế
                backgroundColor: ['rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        };
    }

    // Vẽ biểu đồ
    new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false, // Đảm bảo biểu đồ không bị méo
            plugins: {
                legend: {
                    display: true,
                    position: 'top', // Hiển thị chú thích ở trên
                },
                tooltip: {
                    enabled: true, // Bật tooltip
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 5 // Giảm số lượng nhãn trên trục X
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10 // Tăng khoảng cách giữa các nhãn trên trục Y
                    }
                }
            }
        }
    });
}

function terminateProcess(pid) {
    fetch('/api/process/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: pid })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Hiển thị thông báo
        fetchStats(); // Cập nhật lại bảng tiến trình
    })
    .catch(error => console.error('Error:', error));
}

function restartProcess(pid) {
    fetch('/api/process/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: pid })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Hiển thị thông báo
        fetchStats(); // Cập nhật lại bảng tiến trình
    })
    .catch(error => console.error('Error:', error));
}

// --- Khởi chạy ứng dụng ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    initializeCharts(); // Khởi tạo biểu đồ
    fetchStats(); // Gọi lần đầu để hiển thị ngay lập tức
    setInterval(fetchStats, UPDATE_INTERVAL); // Thiết lập cập nhật định kỳ
    setInterval(fetchRunningApps, 120000); // Thiết lập cập nhật danh sách ứng dụng định kỳ
    fetchRunningApps(); // Gọi lần đầu để hiển thị ngay lập tức
});

document.getElementById('darkModeToggle').addEventListener('click', function () {
    const body = document.body;

    // Chuyển đổi chế độ sáng/tối
    body.classList.toggle('dark-mode');

    // Cập nhật nội dung nút
    if (body.classList.contains('dark-mode')) {
        this.textContent = 'Chế độ sáng';
    } else {
        this.textContent = 'Chế độ tối';
    }
});