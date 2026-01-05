document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', e => {
    if (link.href.includes(window.location.origin)) {
      e.preventDefault();
      document.body.classList.remove('fade-in');
      setTimeout(() => {
        window.location = link.href;
      }, 200);
    }
  });
});
