document.addEventListener("DOMContentLoaded", () => {
  const taglines = [
    "Built for Competition.",
    "Competitive by Design.",
    "More Than a Team."
  ];

  let index = 0;
  const textElement = document.getElementById("rotating-text");

  if (!textElement) return;

  setInterval(() => {
    textElement.classList.add("fade-out");

    setTimeout(() => {
      index = (index + 1) % taglines.length;
      textElement.textContent = taglines[index];
      textElement.classList.remove("fade-out");
      textElement.classList.add("fade-in");
    }, 400);
  }, 3000);
});
