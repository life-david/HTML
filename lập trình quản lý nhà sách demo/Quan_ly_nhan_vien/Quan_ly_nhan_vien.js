let employees = JSON.parse(localStorage.getItem("employees")) || [];

function themNhanVien() {
    let name = prompt("Nhập tên nhân viên:");
    let phone = prompt("Nhập số điện thoại:");
    let email = prompt("Nhập email:");
    let address = prompt("Nhập địa chỉ:");

    if (name && phone && email && address) {
        employees.push({ name, phone, email, address });
        localStorage.setItem("employees", JSON.stringify(employees));
        hienThiNhanVien();
    }
}

function xoaNhanVien(name) {
    let index = employees.findIndex(employee => employee.name === name);
    if (index !== -1) {
        employees.splice(index, 1);
        localStorage.setItem("employees", JSON.stringify(employees));
        hienThiNhanVien();
    }
}

function timNhanVien() {
    let keyword = document.getElementById("search").value.toLowerCase();
    let type = document.getElementById("search-type").value;

    let filteredEmployees = employees.map(employee => {
        let value = employee[type].toLowerCase();
        return {
            ...employee,
            highlight: value.includes(keyword) && keyword !== "" ? keyword : null
        };
    });

    hienThiNhanVien(filteredEmployees);
}

function hienThiNhanVien(filteredList = employees) {
    sapXepNhanVien(); // Sắp xếp nhân viên trước khi hiển thị
    let list = document.getElementById("employee-list");
    list.innerHTML = filteredList.map(employee => {
        let highlightedName = highlightText(employee.name, employee.highlight);
        let highlightedPhone = highlightText(employee.phone, employee.highlight);
        let highlightedEmail = highlightText(employee.email, employee.highlight);
        let highlightedAddress = highlightText(employee.address, employee.highlight);

        return `
            <tr>
                <td>${highlightedName}</td>
                <td>${highlightedPhone}</td>
                <td>${highlightedEmail}</td>
                <td>${highlightedAddress}</td>
                <td><button class="delete-btn" onclick="xoaNhanVien('${employee.name}')">Xóa</button></td>
            </tr>
        `;
    }).join("");
}

function sapXepNhanVien() {
    employees.sort((a, b) => a.name.localeCompare(b.name));
}

function highlightText(text, keyword) {
    if (!keyword || !text.toLowerCase().includes(keyword)) return text;
    let regex = new RegExp(`(${keyword})`, "gi");
    return text.replace(regex, `<span class="highlight">$1</span>`);
}

function quayLai() {
    location.href = "../trang_chu.html"; // Adjust the path as necessary
}

function saveEmployeeInfo() {
    let name = document.getElementById("employee-name").value;
    let email = document.getElementById("employee-email").value;
    let phone = document.getElementById("employee-phone").value;
    let address = document.getElementById("employee-address").value;

    if (name && email && phone && address) {
        let index = employees.findIndex(employee => employee.name === name);
        if (index !== -1) {
            employees[index] = { name, email, phone, address };
        } else {
            employees.push({ name, email, phone, address });
        }
        localStorage.setItem("employees", JSON.stringify(employees));
        hienThiNhanVien();
        alert("Thông tin nhân viên đã được lưu.");
    } else {
        alert("Vui lòng nhập đầy đủ thông tin.");
    }
}

// Hiển thị danh sách nhân viên khi tải trang
hienThiNhanVien();