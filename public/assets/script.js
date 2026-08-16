const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

const cartButtons = document.querySelectorAll(".add-cart");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const prepareOrder = document.querySelector("#prepare-order");
const checkoutMessage = document.querySelector("#checkout-message");
const emailOrder = document.querySelector("#email-order");
const orderForm = document.querySelector("#order-form");
const orderItemsField = document.querySelector("#order-items-field");
const orderTotalField = document.querySelector("#order-total-field");
const cart = [];
const bankPaymentMessage = "In order to maintain transparency with norms and ensure a secure purchasing process, we have made arrangements for your payment to be received through this bank account in a manner that is convenient for you.";
const bankDetails = "Account Name: Md Ahsan Habib%0D%0AAccount Number: 0202220008114%0D%0ABank Name: Dhaka Bank PLC%0D%0ABranch: CDA Avenue%0D%0ARouting Number: 085151482%0D%0ASWIFT Code: DHBLBDDH%0D%0AReference: Your name + order total";

const slideshow = document.querySelector(".slideshow-image");

if (slideshow && slideshow.dataset.slides) {
  const slides = slideshow.dataset.slides.split(",").map((item) => item.trim()).filter(Boolean);
  let currentSlide = 0;
  const TRANSITION_MS = 450;
  const INTERVAL_MS = 5000;

  function advance() {
    if (document.hidden) {
      return;
    }
    currentSlide = (currentSlide + 1) % slides.length;
    slideshow.style.opacity = "0";
    window.setTimeout(() => {
      const next = slides[currentSlide];
      const swap = () => {
        slideshow.src = next;
        slideshow.style.opacity = "1";
      };
      const cached = next.startsWith("data:") ? null : document.querySelector(`img[data-preload="${next}"]`);
      if (cached && cached.complete) {
        swap();
      } else {
        const preloader = new Image();
        preloader.onload = swap;
        preloader.onerror = swap;
        preloader.src = next;
      }
    }, TRANSITION_MS);
  }

  if (slides.length > 1) {
    slides.forEach((src) => {
      if (!src.startsWith("data:")) {
        const img = new Image();
        img.src = src;
        img.setAttribute("data-preload", src);
      }
    });
    slideshow.style.transition = `opacity ${TRANSITION_MS}ms ease`;
    window.setInterval(advance, INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        slideshow.style.opacity = "1";
      }
    });
  }
}

function renderCart() {
  if (!cartItems || !cartTotal) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">No items added yet.</p>';
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `<span>${item.name}<br><strong>$${item.price.toFixed(2)}</strong></span><button type="button" data-index="${index}">Remove</button>`;
      cartItems.appendChild(row);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = `$${total.toFixed(2)}`;

  if (orderItemsField && orderTotalField) {
    orderItemsField.value = cart.map((item) => `- ${item.name}: $${item.price.toFixed(2)}`).join("\n");
    orderTotalField.value = `$${total.toFixed(2)}`;
  }
}

cartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const product = button.closest(".product-card");
    if (!product) return;
    cart.push({
      name: product.dataset.name || "Music product",
      price: Number(product.dataset.price || 0)
    });
    renderCart();
  });
});

if (cartItems) {
  cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    cart.splice(Number(button.dataset.index), 1);
    renderCart();
  });
}

if (prepareOrder && checkoutMessage) {
  prepareOrder.addEventListener("click", () => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const items = cart.map((item) => `- ${item.name}: $${item.price.toFixed(2)}`).join("\n");
    checkoutMessage.textContent = cart.length
      ? `Order prepared:\n${items}\n\nTotal: $${total.toFixed(2)}\n\n${bankPaymentMessage}\n\nAccount Name: Md Ahsan Habib\nAccount Number: 0202220008114\nBank Name: Dhaka Bank PLC\nBranch: CDA Avenue\nRouting Number: 085151482\nSWIFT Code: DHBLBDDH\nReference: Your name + order total\n\nPlease email the payment slip with your name and phone number.`
      : "Please add at least one product before preparing the order.";
  });
}

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    if (cart.length === 0) {
      event.preventDefault();
      checkoutMessage.textContent = "Please add at least one product before emailing the order.";
      return;
    }
    renderCart();
  });
}

renderCart();
