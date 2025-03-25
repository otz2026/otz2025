// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW registered');
        initSync(reg);
      });
  });
}

// Инициализация синхронизации
function initSync(reg) {
  // Для Android
  if ('sync' in reg) {
    document.getElementById('sync-btn').onclick = () => {
      reg.sync.register('sync-data');
    };
  }
  
  // Для iOS (требует HTTPS)
  if ('periodicSync' in reg) {
    navigator.permissions.query({name: 'periodic-background-sync'})
      .then(status => {
        if (status.state === 'granted') {
          reg.periodicSync.register('update-content', {
            minInterval: 24 * 60 * 60 * 1000 // 24 часа
          });
        }
      });
  }
  
  // Проверка обновлений
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateNotification();
      }
    });
  });
}

// Обновление контента
async function updateContent() {
  const response = await fetch('/api/content');
  const data = await response.json();
  
  // Обновляем UI
  document.getElementById('content').innerText = data.text;
  
  // Сохраняем в локальное хранилище
  localStorage.setItem('cachedContent', JSON.stringify(data));
  
  return data;
}

// Показ уведомления
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Доступно обновление', {
      body: 'Нажмите, чтобы обновить приложение',
      icon: '/img/icon-192x192.png'
    }).onclick = () => window.location.reload();
  }
}

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', () => {
  const cached = localStorage.getItem('cachedContent');
  if (cached) {
    document.getElementById('content').innerText = JSON.parse(cached).text;
  }
  updateContent();
});
