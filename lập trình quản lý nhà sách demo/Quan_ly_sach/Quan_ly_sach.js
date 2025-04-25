// Lấy danh sách sách từ localStorage hoặc khởi tạo mảng rỗng
let books = JSON.parse(localStorage.getItem("books")) || [];

function hienThiSach() {
  sapXepSach(); // Sắp xếp sách trước khi hiển thị
  const bookList = document.getElementById("book-list");
  bookList.innerHTML = books.map((book, index) => {
    return `<tr>
      <td>${book.name}</td>
      <td>${book.author}</td>
      <td>${book.publisher}</td>
      <td>${book.category}</td>
      <td><input type="number" value="${book.quantity}" onchange="capNhatSoLuong(${index}, this.value)" /></td>
      <td>${parseFloat(book.totalPrice).toLocaleString()}</td>
      <td><button class="delete-btn" onclick="xoaSach(${index})">Xóa</button></td>
    </tr>`;
  }).join("");
}

function sapXepSach() {
  books.sort((a, b) => a.name.localeCompare(b.name));
}

function themSach() {
  let name = prompt("Nhập tên sách:");
  let author = prompt("Nhập tác giả:");
  let publisher = prompt("Nhập NXB:");
  let category = prompt("Nhập thể loại:");
  let quantityInput = prompt("Nhập số lượng sách:");
  let priceInput = prompt("Nhập đơn giá sách (VNĐ):");
  
  let quantity = parseInt(quantityInput);
  let price = parseFloat(priceInput);
  
  if(name && author && publisher && category && !isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0){
    // Tính tổng giá của sách dựa trên số lượng * đơn giá
    let totalPrice = quantity * price;
    books.push({ name, author, publisher, category, quantity, price, totalPrice });
    localStorage.setItem("books", JSON.stringify(books));
    hienThiSach();
  } else {
    alert("Thông tin không hợp lệ!");
  }
}

function xoaSach(index) {
  if(confirm("Bạn có chắc muốn xóa sách này?")){
    books.splice(index, 1);
    localStorage.setItem("books", JSON.stringify(books));
    hienThiSach();
  }
}

function capNhatSoLuong(index, newQuantity) {
  newQuantity = parseInt(newQuantity);
  if(!isNaN(newQuantity) && newQuantity >= 0){
    books[index].quantity = newQuantity;
    books[index].totalPrice = books[index].quantity * books[index].price;
    localStorage.setItem("books", JSON.stringify(books));
    hienThiSach();
  } else {
    alert("Số lượng không hợp lệ!");
  }
}

function timSach() {
  let keyword = document.getElementById("search").value.toLowerCase();
  let type = document.getElementById("search-type").value;
  let filtered = books.filter(book => book[type].toLowerCase().includes(keyword));
  const bookList = document.getElementById("book-list");
  bookList.innerHTML = filtered.map((book, index) => {
    return `<tr>
      <td>${book.name}</td>
      <td>${book.author}</td>
      <td>${book.publisher}</td>
      <td>${book.category}</td>
      <td>${book.quantity}</td>
      <td>${parseFloat(book.totalPrice).toLocaleString()}</td>
      <td><button class="delete-btn" onclick="xoaSach(${index})">Xóa</button></td>
    </tr>`;
  }).join("");
}

function quayLai() {
  location.href = "../trang_chu.html"; // Điều chỉnh đường dẫn nếu cần
}

window.onload = function(){
  hienThiSach();
};
