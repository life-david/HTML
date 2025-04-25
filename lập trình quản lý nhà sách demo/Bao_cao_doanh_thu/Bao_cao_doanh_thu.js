function formatDateToDisplay(date) {
  let [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

function updateRevenueReport() {
  let revenue = JSON.parse(localStorage.getItem("revenue")) || {};
  let reportList = document.getElementById("report-list");
  reportList.innerHTML = "";

  // Chuyển đổi các ngày thành đối tượng Date và sắp xếp chúng
  let sortedDates = Object.keys(revenue).sort((a, b) => new Date(a) - new Date(b));

  // Hiển thị báo cáo doanh thu theo thứ tự đã sắp xếp
  sortedDates.forEach(date => {
    let displayDate = formatDateToDisplay(date);
    reportList.innerHTML += `<tr>
      <td>${displayDate}</td>
      <td>${revenue[date].toLocaleString()} VNĐ</td>
      <td><button class="delete-btn" onclick="deleteRevenue('${date}')">Xóa</button></td>
    </tr>`;
  });
}

function deleteRevenue(date) {
  let revenue = JSON.parse(localStorage.getItem("revenue")) || {};
  if (confirm("Bạn có chắc muốn xóa doanh thu của ngày " + formatDateToDisplay(date) + "?")) {
    delete revenue[date];
    localStorage.setItem("revenue", JSON.stringify(revenue));
    updateRevenueReport();
  }
}

function quayLai() {
  location.href = "../trang_chu.html"; // Điều chỉnh đường dẫn nếu cần
}

window.onload = updateRevenueReport;
