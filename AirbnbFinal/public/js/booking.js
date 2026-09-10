const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");
const totalPriceSpan = document.getElementById("totalPrice");
const pricePerNight = window.listingPrice; // set this in show.ejs

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

checkInInput.addEventListener("change", calculateTotal);
checkOutInput.addEventListener("change", calculateTotal);
