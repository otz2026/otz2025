// Конфигурация
const CONFIG = {
  API_URL: '/otz2025/api/data',
  UPDATE_INTERVAL: 300000, // 5 минут
  CACHE_KEY: 'otz-ui-cache'
};

// DOM элементы
const elements = {
  content: document.getElementById('content'),
  loader: document.getElementById('loader'),
  offlineAlert: document.getElementById('offline-alert')
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  loadInitialData();
  setupUpdateInterval();
  setupEventListeners();
});

// Работа с Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/otz2025/sw.js')
      .then(reg => {
        console.log('SW registered');
        setupPeriodicSync(reg);
      });
  }
}

// Загрузка данных
async function loadInitialData() {
  showLoader();
  
  try {
    // Пытаемся получить свежие данные
    const data = await fetchData(CONFIG.API_URL);
    renderData(data);
    saveToCache(data);
  } catch (err) {
    // Если ошибка - пробуем взять из кэша
    const cachedData = await getCachedData();
    if (cachedData) {
      renderData(cachedData);
      showMessage('Используются кэшированные данные');
    } else {
      showError('Не удалось загрузить данные');
    }
  } finally {
    hideLoader();
  }
}

// Получение данных с сервера
async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

// Работа с локальным кэшем
async function getCachedData() {
  if ('caches' in window) {
    const cache = await caches.open(API_CACHE);
    const response = await cache.match(CONFIG.API_URL);
    return response ? response.json() : null;
  }
  return null;
}

function saveToCache(data) {
  if ('caches' in window) {
    caches.open(API_CACHE)
      .then(cache => 
        cache.put(CONFIG.API_URL, 
          new Response(JSON.stringify(data)))
      );
  }
}

// Рендеринг данных
function renderData(data) {
  if (!elements.content) return;
  
  elements.content.innerHTML = `
    <div class="content-block">
      <h2>${data.title}</h2>
      <p>${data.content}</p>
      <small>Обновлено: ${new Date().toLocaleString()}</small>
    </div>
  `;
  
  // Анимация появления
  setTimeout(() => {
    elements.content.querySelector('.content-block')
      .style.opacity = 1;
  }, 50);
}

// Фоновая синхронизация
function setupPeriodicSync(reg) {
  // Для Android
  if ('sync' in reg) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        reg.sync.register('update-content');
      }
    });
  }
  
  // Для iOS
  if ('periodicSync' in reg) {
    navigator.permissions.query({name: 'periodic-background-sync'})
      .then(status => {
        if (status.state === 'granted') {
          reg.periodicSync.register('update-content', {
            minInterval: CONFIG.UPDATE_INTERVAL
          });
        }
      });
  }
}

// Вспомогательные функции
function setupUpdateInterval() {
  setInterval(() => {
    if (!document.hidden) {
      checkForUpdates();
    }
  }, CONFIG.UPDATE_INTERVAL);
}

async function checkForUpdates() {
  try {
    const data = await fetchData(CONFIG.API_URL);
    const cachedData = await getCachedData();
    
    if (JSON.stringify(data) !== JSON.stringify(cachedData)) {
      renderData(data);
      saveToCache(data);
      showMessage('Данные обновлены', 2000);
    }
  } catch (err) {
    console.log('Ошибка при проверке обновлений:', err);
  }
}

function showLoader() {
  if (elements.loader) elements.loader.style.display = 'block';
}

function hideLoader() {
  if (elements.loader) elements.loader.style.display = 'none';
}

function showMessage(text, duration = 3000) {
  const msg = document.createElement('div');
  msg.className = 'notification';
  msg.textContent = text;
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.classList.add('fade-out');
    setTimeout(() => msg.remove(), 500);
  }, duration);
}

function setupEventListeners() {
  // Обработка онлайн/офлайн статуса
  window.addEventListener('online', () => {
    elements.offlineAlert.style.display = 'none';
    checkForUpdates();
  });
  
  window.addEventListener('offline', () => {
    elements.offlineAlert.style.display = 'block';
  });
}
