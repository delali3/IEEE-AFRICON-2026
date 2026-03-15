/* Highlight active sidebar link based on hash */
document.addEventListener('DOMContentLoaded', function () {
  const hash = window.location.hash;
  if (hash) {
    document.querySelectorAll('.sidebar a').forEach(a => {
      if (a.getAttribute('href') === hash) a.classList.add('active');
    });
  }
});
