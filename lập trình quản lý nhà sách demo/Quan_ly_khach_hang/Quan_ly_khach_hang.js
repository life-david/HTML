let customers = JSON.parse(localStorage.getItem("customers")) || [];

// Hiển thị thông tin khách hàng từ đơn hàng
function hienThiThongTinKhachHang() {
  let currentCustomer = localStorage.getItem("currentCustomer");
  if (currentCustomer) {
    try {
      let customerData = JSON.parse(currentCustomer); // Chuyển từ string về object

      // Gán dữ liệu vào các ô nhập
      document.getElementById("customer-name").value = customerData.name || "";
      document.getElementById("customer-phone").value = customerData.phone || "";
      document.getElementById("customer-email").value = customerData.email || "";
      document.getElementById("customer-address").value = customerData.address || "";
      
      // Xóa dữ liệu sau khi tải
      localStorage.removeItem("currentCustomer");
    } catch (error) {
      console.error("Lỗi khi đọc dữ liệu khách hàng từ localStorage:", error);
    }
  }
}

function themKhachHang() {
  let name = document.getElementById("customer-name").value;
  let phone = document.getElementById("customer-phone").value;
  let email = document.getElementById("customer-email").value;
  let address = document.getElementById("customer-address").value;

  if (name && phone && email && address) {
    customers.push({ name, phone, email, address });
    localStorage.setItem("customers", JSON.stringify(customers));
    hienThiKhachHang();
  }
}

function xoaKhachHang(name) {
  let index = customers.findIndex(customer => customer.name === name);
  if (index !== -1) {
    customers.splice(index, 1);
    localStorage.setItem("customers", JSON.stringify(customers));
    hienThiKhachHang();
  }
}

function timKhachHang() {
  let keyword = document.getElementById("search").value.toLowerCase();
  let type = document.getElementById("search-type").value;

  let filteredCustomers = customers.map(customer => {
    let value = customer[type].toLowerCase();
    return {
      ...customer,
      highlight: value.includes(keyword) && keyword !== "" ? keyword : null
    };
  });

  hienThiKhachHang(filteredCustomers);
}

function hienThiKhachHang(filteredList = customers) {
  let list = document.getElementById("customer-list");
  list.innerHTML = filteredList.map((customer, index) => {
    let highlightedName = highlightText(customer.name, customer.highlight);
    let highlightedPhone = highlightText(customer.phone, customer.highlight);
    let highlightedEmail = highlightText(customer.email, customer.highlight);

    return `
      <tr>
        <td><input type="text" value="${highlightedName}" onchange="capNhatKhachHang(${index}, 'name', this.value)" /></td>
        <td><input type="text" value="${highlightedPhone}" onchange="capNhatKhachHang(${index}, 'phone', this.value)" /></td>
        <td><input type="email" value="${highlightedEmail}" onchange="capNhatKhachHang(${index}, 'email', this.value)" /></td>
        <td><input type="text" value="${customer.address}" onchange="capNhatKhachHang(${index}, 'address', this.value)" /></td>
        <td><button class="delete-btn" onclick="xoaKhachHang('${customer.name}')">Xóa</button></td>
      </tr>
    `;
  }).join("");
}

function sapXepKhachHang() {
  customers.sort((a, b) => a.name.localeCompare(b.name));
}

function capNhatKhachHang(index, field, value) {
  customers[index][field] = value;
  localStorage.setItem("customers", JSON.stringify(customers));
}

function highlightText(text, keyword) {
  if (!keyword || !text.toLowerCase().includes(keyword)) return text;
  let regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

function quayLai() {
  location.href = "../trang_chu.html"; // Adjust the path as necessary
}

// Hiển thị danh sách khách hàng khi tải trang
hienThiKhachHang();
hienThiThongTinKhachHang();

document.addEventListener("DOMContentLoaded", hienThiThongTinKhachHang);
