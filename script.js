if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js') // Укажите правильный путь, если sw.js не в корне
      .then(registration => console.log('ServiceWorker зарегистрирован'))
      .catch(err => console.log('Ошибка ServiceWorker:', err));
  });
}
