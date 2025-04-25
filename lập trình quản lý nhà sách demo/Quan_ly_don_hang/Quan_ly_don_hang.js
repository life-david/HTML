// Lấy danh sách đơn hàng từ localStorage hoặc khởi tạo mảng rỗng nếu không có dữ liệu
let orders = JSON.parse(localStorage.getItem("orders")) || [];

// Các biến toàn cục dùng để lưu tạm thông tin đơn hàng và sách được chọn
let orderHeader = null;       // Lưu thông tin chung của đơn hàng (mã, ngày, khách hàng)
let selectedBookOrder = null; // Lưu thông tin sách được chọn (tên sách, số lượng mua, tổng giá)

// Biến toàn cục cho panel "Thông Tin Khách Hàng"
let currentCustomerIndex = null; // Chỉ số (index) của đơn hàng trong mảng orders, để sửa khách hàng

//--------------------------------------------------------------------
// HÀM TẠO ĐƠN HÀNG + CHỌN SÁCH
//--------------------------------------------------------------------
function taoDonHang() {
  let idInput = prompt("Nhập mã đơn hàng (tối đa 5 chữ số):");
  if (!idInput) {
    alert("Mã đơn hàng không được để trống!");
    return;
  }
  let idNumber = parseInt(idInput, 10);
  if (isNaN(idNumber)) {
    alert("Mã đơn hàng phải là số!");
    return;
  }
  if (idNumber >= 100000) {
    alert("Mã đơn hàng chỉ tối đa 5 chữ số!");
    return;
  }
  let formattedId = idNumber.toString().padStart(5, "0");

  let date = prompt("Nhập ngày đơn hàng (DD-MM-YYYY):");
  let customer = prompt("Nhập tên khách hàng:");

  if (formattedId && date && customer) {
    orderHeader = { id: formattedId, date: formatDateToISO(date), customer };
    // Mở panel chọn sách
    openBookPanel();
  } else {
    alert("Thông tin đơn hàng không đầy đủ!");
  }
}

function openBookPanel() {
  let panel = document.getElementById("book-panel");
  panel.classList.add("show");

  let books = JSON.parse(localStorage.getItem("books")) || [];
  let bookSelectList = document.getElementById("book-select-list");

  bookSelectList.innerHTML = books.map((book, index) => {
    return `<tr>
      <td>${book.name}</td>
      <td>${parseFloat(book.price).toLocaleString()} VNĐ</td>
      <td>${book.quantity}</td>
      <td><button onclick="selectBook(${index})">Chọn</button></td>
    </tr>`;
  }).join("");
}

function closeBookPanel() {
  let panel = document.getElementById("book-panel");
  panel.classList.remove("show");
}

function selectBook(index) {
  let books = JSON.parse(localStorage.getItem("books")) || [];
  let book = books[index];

  let qtyInput = prompt("Nhập số lượng sách mua (Có sẵn: " + book.quantity + "):");
  let qty = parseInt(qtyInput);
  if (isNaN(qty) || qty <= 0) {
    alert("Số lượng không hợp lệ!");
    return;
  }
  if (qty > book.quantity) {
    alert("Không đủ số lượng sách! Số lượng hiện có: " + book.quantity);
    return;
  }
  let price = parseFloat(book.price);
  let totalValue = price * qty;

  selectedBookOrder = { bookName: book.name, quantity: qty, totalValue: totalValue };

  closeBookPanel();
  completeOrderCreation();
}

function completeOrderCreation() {
  if (!orderHeader || !selectedBookOrder) {
    alert("Thông tin đơn hàng không đầy đủ!");
    return;
  }
  let order = {
    id: orderHeader.id,
    date: orderHeader.date,
    customer: orderHeader.customer,
    bookName: selectedBookOrder.bookName,
    quantity: selectedBookOrder.quantity,
    totalValue: selectedBookOrder.totalValue,
    profitRate: selectedBookOrder.profitRate || 20 // Mặc định lãi suất là 20%
  };

  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  let profit = order.totalValue * (order.profitRate / 100);
  updateRevenue(order.date, profit);
  updateBookQuantity(order.bookName, order.quantity);

  alert("Đơn hàng đã được tạo, doanh thu cập nhật và số lượng sách giảm.");
  updateOrderTable();

  // Nếu có đơn hàng, hiển thị liên kết chuyển sang trang Báo Cáo Doanh Thu
  if (orders.length > 0) {
    document.getElementById("hidden-revenue-link")?.style.setProperty("display", "inline-block");
  }

  // Cuộn trang xuống để hiển thị bảng đơn hàng
  document.getElementById("order-table")?.scrollIntoView({ behavior: "smooth" });

  orderHeader = null;
  selectedBookOrder = null;
}

//--------------------------------------------------------------------
// HÀM QUẢN LÝ KHÁCH HÀNG (PANEL)
//--------------------------------------------------------------------

// Mở panel "Thông Tin Khách Hàng" để xem/sửa
function openCustomerPanel(index) {
  currentCustomerIndex = index; // Lưu lại index của đơn hàng
  let order = orders[index];

  // Lấy panel và các input
  let panel = document.getElementById("customer-panel");
  let nameInput = document.getElementById("customer-name");
  let emailInput = document.getElementById("customer-email");
  let phoneInput = document.getElementById("customer-phone");
  let addressInput = document.getElementById("customer-address");

  // Có thể bạn sẽ lưu trữ thông tin chi tiết khách hàng ở đâu đó
  // Ở đây, ví dụ ta chỉ có 'customer' = tên, ta thêm 'email', 'phone', 'address' tạm
  // => Tùy biến theo ý bạn
  // Giả sử ta lưu 1 object "customerInfo" trong order, check trước
  if (!order.customerInfo) {
    order.customerInfo = {
      name: order.customer || "",
      email: "",
      phone: "",
      address: ""
    };
  }
  // Hiển thị lên form
  nameInput.value = order.customerInfo.name;
  emailInput.value = order.customerInfo.email;
  phoneInput.value = order.customerInfo.phone;
  addressInput.value = order.customerInfo.address;

  // Mở panel
  panel.classList.add("show");
}

// Đóng panel "Thông Tin Khách Hàng"
function closeCustomerPanel() {
  let panel = document.getElementById("customer-panel");
  panel.classList.remove("show");
  currentCustomerIndex = null;
}

// Lưu thông tin khách hàng vào order
function saveCustomerInfo() {
  if (currentCustomerIndex == null) return;
  let order = orders[currentCustomerIndex];

  let nameInput = document.getElementById("customer-name").value;
  let emailInput = document.getElementById("customer-email").value;
  let phoneInput = document.getElementById("customer-phone").value;
  let addressInput = document.getElementById("customer-address").value;

  // Cập nhật order.customerInfo
  order.customerInfo = {
    name: nameInput,
    email: emailInput,
    phone: phoneInput,
    address: addressInput
  };
  // Đồng thời, nếu muốn hiển thị "Khách Hàng" là name, ta cập nhật:
  order.customer = nameInput;

  localStorage.setItem("orders", JSON.stringify(orders));
  updateOrderTable();

  alert("Đã lưu thông tin khách hàng.");
}

// Tải thông tin khách hàng sang trang Quản Lý Khách Hàng
function exportToCustomerPage() {
  let nameInput = document.getElementById("customer-name").value;
  let emailInput = document.getElementById("customer-email").value;
  let phoneInput = document.getElementById("customer-phone").value;
  let addressInput = document.getElementById("customer-address").value;

  // Tạo đối tượng thông tin khách hàng
  const customerInfo = {
    name: nameInput,
    email: emailInput,
    phone: phoneInput,
    address: addressInput
  };

  // Lưu vào LocalStorage
  localStorage.setItem("currentCustomer", JSON.stringify(customerInfo));

  // Hiển thị thông báo & chuyển hướng
  alert("Đã tải thông tin sang Quản Lý Khách Hàng!");
  window.location.href = "../Quan_ly_khach_hang/Quan_ly_khach_hang.html"; // Điều chỉnh đường dẫn nếu cần
}

function loadCustomerInfo() {
  let data = localStorage.getItem("selectedCustomer");
  if (!data) {
    alert("Không có dữ liệu khách hàng!");
    return;
  }

  let customer = JSON.parse(data);

  // Hiển thị dữ liệu vào bảng hoặc form
  document.getElementById("customerName").innerText = customer.name;
  document.getElementById("customerPhone").innerText = customer.phone;
  document.getElementById("customerEmail").innerText = customer.email;
  document.getElementById("customerAddress").innerText = customer.address;
}

// Khi trang load, tự động gọi hàm này
document.addEventListener("DOMContentLoaded", loadCustomerInfo);

//--------------------------------------------------------------------
// DOANH THU & SỐ LƯỢNG SÁCH
//--------------------------------------------------------------------
function updateRevenue(date, profit) {
  let revenue = JSON.parse(localStorage.getItem("revenue")) || {};
  if (!revenue[date]) {
    revenue[date] = 0;
  }
  revenue[date] += profit;
  localStorage.setItem("revenue", JSON.stringify(revenue));
}

function updateBookQuantity(bookName, quantityPurchased) {
  let books = JSON.parse(localStorage.getItem("books")) || [];
  let found = false;
  books = books.map(book => {
    if (book.name.toLowerCase() === bookName.toLowerCase()) {
      found = true;
      book.quantity = Math.max(book.quantity - quantityPurchased, 0);
      book.totalPrice = book.quantity * parseFloat(book.price);
    }
    return book;
  });
  if (!found) {
    alert("Không tìm thấy sách: " + bookName + " trong Quản Lý Sách.");
  }
  localStorage.setItem("books", JSON.stringify(books));
}

//--------------------------------------------------------------------
// QUẢN LÝ XÓA ĐƠN HÀNG
//--------------------------------------------------------------------
function xoaDonHangTheoMa(index) {
  let order = orders[index];
  if (confirm("Bạn có chắc muốn xóa đơn hàng " + order.id + "?")) {
    let revenue = JSON.parse(localStorage.getItem("revenue")) || {};
    // Giả sử profit = (order.profitRate || 20)% của order.totalValue => ta phải trừ ra
    let profit = order.totalValue * ((order.profitRate || 20) / 100);
    if (revenue[order.date]) {
      revenue[order.date] -= profit;
      if (revenue[order.date] < 0) revenue[order.date] = 0;
      localStorage.setItem("revenue", JSON.stringify(revenue));
    }
    orders.splice(index, 1);
    localStorage.setItem("orders", JSON.stringify(orders));
    updateOrderTable();
    if (orders.length === 0) {
      document.getElementById("hidden-revenue-link")?.style.setProperty("display", "none");
    }
    alert("Đã xóa đơn hàng " + order.id);
  }
}

function xoaHetMa() {
  if (confirm("Bạn có chắc muốn xóa hết các đơn hàng?")) {
    orders = [];
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("revenue", JSON.stringify({}));
    updateOrderTable();
    document.getElementById("hidden-revenue-link")?.style.setProperty("display", "none");
    alert("Đã xóa hết các đơn hàng.");
  }
}

//--------------------------------------------------------------------
// CẬP NHẬT BẢNG ĐƠN HÀNG
//--------------------------------------------------------------------
function updateOrderTable() {
  let orderList = document.getElementById("order-list");

  // Sắp xếp đơn hàng theo thứ tự thời gian từ trước đến sau
  orders.sort((a, b) => new Date(a.date) - new Date(b.date));

  orderList.innerHTML = orders.map((order, index) => {
    let displayDate = formatDateToDisplay(order.date);
    let profitRate = order.profitRate || 20;
    let profit = order.totalValue * (profitRate / 100);
    let sellingPrice = order.totalValue + profit;

    // Thông tin khách hàng: hiển thị tên + nút "Chi Tiết"
    // Bấm "Chi Tiết" sẽ mở panel "Thông Tin Khách Hàng"
    let customerCell = `
      ${order.customer || "N/A"}
      <button onclick="openCustomerPanel(${index})" style="margin-left:5px;">Chi Tiết</button>
    `;

    return `
      <tr>
        <td>${order.id}</td>
        <td>${displayDate}</td>
        <td>${customerCell}</td>
        <td>${order.bookName}</td>
        <td>${order.quantity}</td>
        <td>${sellingPrice.toLocaleString()} VNĐ</td>
        <td class="toggleable">
          <input type="number" value="${profitRate}" min="0" max="100" step="1"
                 onchange="updateProfitRate(${index}, this.value)" /> %
        </td>
        <td class="toggleable">${profit.toLocaleString()} VNĐ</td>
        <td><button class="delete-btn" onclick="xoaDonHangTheoMa(${index})">Xóa</button></td>
      </tr>`;
  }).join("");
}

// Hàm cập nhật lãi suất và tính lại tổng giá trị đơn hàng
function updateProfitRate(index, newRate) {
  let order = orders[index];
  let oldProfit = order.totalValue * (order.profitRate / 100);
  order.profitRate = parseFloat(newRate);
  let newProfit = order.totalValue * (order.profitRate / 100);

  // Cập nhật doanh thu
  let revenue = JSON.parse(localStorage.getItem("revenue")) || {};
  if (!revenue[order.date]) {
    revenue[order.date] = 0;
  }
  revenue[order.date] = revenue[order.date] - oldProfit + newProfit;
  localStorage.setItem("revenue", JSON.stringify(revenue));

  localStorage.setItem("orders", JSON.stringify(orders));
  updateOrderTable();
  // Giả sử bạn có hàm updateRevenueReport() để cập nhật ngay báo cáo doanh thu
  // updateRevenueReport();
}

//--------------------------------------------------------------------
// CÁC HÀM TIỆN ÍCH KHÁC
//--------------------------------------------------------------------
function quayLai() {
  location.href = "../trang_chu.html"; // Điều chỉnh đường dẫn nếu cần
}

function formatDateToISO(date) {
  let [day, month, year] = date.split("-");
  return `${year}-${month}-${day}`;
}

function formatDateToDisplay(date) {
  let [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

// Ẩn/hiện các cột lãi suất và lợi nhuận
function toggleColumns() {
  let table = document.getElementById("order-table");
  table.classList.toggle("show-columns");
}

// Khi trang được tải
window.onload = function() {
  orders = JSON.parse(localStorage.getItem("orders")) || [];
  updateOrderTable();
  let revenueLink = document.getElementById("hidden-revenue-link");
  if (orders.length > 0) {
    revenueLink?.style.setProperty("display", "inline-block");
    revenueLink?.addEventListener("click", function() {
      location.href = "../Quan_Ly_khach_hang/Quan_ly_khach_hang.html"; // Điều chỉnh đường dẫn nếu cần
    });
  } else {
    revenueLink?.style.setProperty("display", "none");
  }
};
