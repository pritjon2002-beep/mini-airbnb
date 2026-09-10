const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");
const totalPriceSpan = document.getElementById("totalPrice");
const pricePerNight = window.listingPrice; // set this in show.ejs

// new Date().toISOString() → gives today's date/time in a standard format like "2026-09-10T14:30:00.000Z"
// .split("T")[0] → cuts off the time part, keeping just "2026-09-10" — the exact format HTML date inputs expect
// setAttribute("min", today) → the browser's date picker will now grey out/block any date before today
const today = new Date().toISOString().split("T")[0];
checkInInput.setAttribute("min", today);
checkOutInput.setAttribute("min", today);

function calculateTotal() {
  const checkIn = new Date(checkInInput.value);
  const checkOut = new Date(checkOutInput.value);

  if (checkIn && checkOut && checkOut > checkIn) {
    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    totalPriceSpan.textContent = (nights * pricePerNight).toLocaleString(
      "en-IN",
    );
  } else {
    totalPriceSpan.textContent = "0";
  }
}

checkInInput.addEventListener("change", () => {
  checkInInput.setAttribute("min", checkInInput.value);
  calculateTotal();
});

checkOutInput.addEventListener("change", () => {
  checkOutInput.setAttribute("min", checkOutInput.value);
  calculateTotal();
});
