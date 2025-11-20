document.addEventListener("DOMContentLoaded", () => {

 
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const loadCart = () => JSON.parse(localStorage.getItem("cart") || "[]");
  const saveCart = cart => localStorage.setItem("cart", JSON.stringify(cart));

  const fmt = n =>
    Number(n).toLocaleString(undefined, { style: "currency", currency: "USD" });

  
  // UPDATE CART COUNT

  function updateCartCount() {
    const el = $("#cart-count");
    if (!el) return;
    const cart = loadCart();
    let totalQty = 0;
    cart.forEach(i => totalQty += i.qty);
    el.textContent = totalQty;
  }

  updateCartCount();


  // ADD TO CART

  $$(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      if (!card) return;

      const id = card.dataset.id;
      const price = Number(card.dataset.price);
      const title = card.querySelector("h3").textContent;

      let cart = loadCart();
      const item = cart.find(i => i.id === id);

      if (!item) {
        cart.push({ id, title, price, qty: 1 });
      } else {
        item.qty++;
      }

      saveCart(cart);
      updateCartCount();
      alert(`${title} added to cart`);
    });
  });

  // REGISTER FORM
  
  $("#register-form")?.addEventListener("submit", e => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const pass = fd.get("password");
    const confirm = fd.get("confirm");

    if (pass !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push({
      username: fd.get("username"),
      password: pass
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Redirecting to login...");
    window.location.href = "login.html";
  });

 
  // LOGIN FORM
 
  $("#login-form")?.addEventListener("submit", e => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const username = fd.get("username");
    const password = fd.get("password");

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find(u => u.username === username && u.password === password);

    if (!found) {
      alert("Invalid login!");
      return;
    }

    alert("Login successful!");
    window.location.href = "index.html";
  });

  // CART PAGE LOGIC
 
  if ($("#cart-items")) {
    const list = $("#cart-items");
    const subEl = $("#cart-sub");
    const taxEl = $("#cart-tax");
    const discEl = $("#cart-discount");
    const totalEl = $("#cart-total");
    const clearBtn = $("#clear-cart");

    function renderCart() {
      let cart = loadCart();
      list.innerHTML = "";

      if (cart.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align:center;">Your cart is empty.</td></tr>`;
        subEl.textContent = "$0.00";
        discEl.textContent = "-$0.00";
        taxEl.textContent = "$0.00";
        totalEl.textContent = "$0.00";
        return;
      }

      let subtotal = 0;

      cart.forEach((item, i) => {
        const sub = item.price * item.qty;
        subtotal += sub;

        list.innerHTML += `
          <tr>
            <td>${item.title}</td>
            <td>${fmt(item.price)}</td>
            <td>
              <button class="qty-btn" data-index="${i}" data-action="minus">-</button>
              ${item.qty}
              <button class="qty-btn" data-index="${i}" data-action="plus">+</button>
            </td>
            <td>${fmt(sub)}</td>
            <td><button class="remove-btn" data-index="${i}">x</button></td>
          </tr>
        `;
      });

      const discount = 0;
      const tax = subtotal * 0.15;
      const total = subtotal - discount + tax;

      subEl.textContent = fmt(subtotal);
      discEl.textContent = `-${fmt(discount)}`;
      taxEl.textContent = fmt(tax);
      totalEl.textContent = fmt(total);

      saveCart(cart);
      updateCartCount();
    }

    document.addEventListener("click", e => {
      if (e.target.classList.contains("qty-btn")) {
        let cart = loadCart();
        const i = Number(e.target.dataset.index);
        const action = e.target.dataset.action;

        if (action === "plus") cart[i].qty++;
        if (action === "minus" && cart[i].qty > 1) cart[i].qty--;

        saveCart(cart);
        renderCart();
      }

      if (e.target.classList.contains("remove-btn")) {
        let cart = loadCart();
        const i = Number(e.target.dataset.index);
        cart.splice(i, 1);

        saveCart(cart);
        renderCart();
      }
    });

    clearBtn?.addEventListener("click", () => {
      localStorage.removeItem("cart");
      renderCart();
      updateCartCount();
    });

    renderCart();
  }


  // CHECKOUT PAGE LOGIC

  if ($("#checkout-form")) {
    const amountField = $("#amountPaid");
    const summaryBox = $("#orderSummary");
    const confirmBtn = $("#confirmOrder");

    function loadSummary() {
      const cart = loadCart();
      if (cart.length === 0) {
        summaryBox.innerHTML = `<p>Your cart is empty.</p>`;
        amountField.value = 0;
        return;
      }

      let subtotal = 0;
      cart.forEach(item => subtotal += item.price * item.qty);

      const discount = 0;
      const tax = subtotal * 0.15;
      const total = subtotal - discount + tax;

      amountField.value = total.toFixed(2);

      summaryBox.innerHTML = `
        <p><strong>Subtotal:</strong> ${fmt(subtotal)}</p>
        <p><strong>Tax (15%):</strong> ${fmt(tax)}</p>
        <p><strong>Total:</strong> ${fmt(total)}</p>
      `;
    }

    $("#cancel-order")?.addEventListener("click", () => {
      window.location.href = "cart.html";
    });

    confirmBtn?.addEventListener("click", () => {
      const custName = $("#custName").value.trim();
      const custAddress = $("#custAddress").value.trim();

      if (!custName || !custAddress) {
        alert("Please fill in your shipping details.");
        return;
      }

      const cart = loadCart();
      if (cart.length === 0) {
        alert("Cart is empty!");
        return;
      }

      const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
      const discount = 0;
      const tax = subtotal * 0.15;
      const total = subtotal - discount + tax;

      const order = {
        customer: { name: custName, address: custAddress },
        items: cart,
        subtotal, discount, tax, total,
        date: new Date().toLocaleString()
      };

      // Save last order for invoice
      localStorage.setItem("lastOrder", JSON.stringify(order));

      // Clear cart
      localStorage.removeItem("cart");
      updateCartCount();

      // Redirect to invoice
      window.location.href = "invoice.html";
    });

    loadSummary();
  }

 
  // INVOICE PAGE LOGIC
  
  if ($("#invoice")) {
    const invoiceEl = $("#invoice");
    const order = JSON.parse(localStorage.getItem("lastOrder") || "null");

    if (!order) {
      invoiceEl.innerHTML = "<p>No order found.</p>";
    } else {
      let itemsHTML = "";
      order.items.forEach(i => {
        const sub = i.price * i.qty;
        itemsHTML += `
          <tr>
            <td>${i.title}</td>
            <td>${i.qty}</td>
            <td>${fmt(i.price)}</td>
            <td>${fmt(sub)}</td>
          </tr>
        `;
      });

      invoiceEl.innerHTML = `
        <h2>Invoice — Crafted Candles</h2>
        <p><strong>Date:</strong> ${order.date}</p>
        <p><strong>Customer:</strong> ${order.customer.name}</p>
        <p><strong>Address:</strong> ${order.customer.address}</p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Sub-total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr><td colspan="3">Subtotal</td><td>${fmt(order.subtotal)}</td></tr>
            <tr><td colspan="3">Discount</td><td>-${fmt(order.discount)}</td></tr>
            <tr><td colspan="3">Tax (15%)</td><td>${fmt(order.tax)}</td></tr>
            <tr><td colspan="3">Total</td><td>${fmt(order.total)}</td></tr>
          </tfoot>
        </table>
      `;
    }
  }

});
