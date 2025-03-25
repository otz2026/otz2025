// Конфигурация
const CONFIG = {
  API_URL: '/otz2025/api/data',
  UPDATE_INTERVAL: 300000, // 5 минут
  CACHE_KEY: 'otz-app-data'
};

// Состояние приложения
const state = {
  isOnline: navigator.onLine,
  lastUpdate: null,
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: /Android/.test(navigator.userAgent)
};

// Инициализация
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  registerServiceWorker();
  setupEventListeners();
  loadInitialData();
  
  // Особые настройки для iOS
  if (state.isIOS) {
    document.body.classList.add('ios');
    setupIOSHandlers();
  }
  
  // Особые настройки для Android
  if (state.isAndroid) {
    document.body.classList.add('android');
    setupAndroidHandlers();
  }
}

// Регистрация Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/otz2025/sw.js', {
      scope: '/otz2025/'
    })
    .then(registration => {
      console.log('SW зарегистрирован:', registration.scope);
      
      // Проверка обновлений каждые 5 минут
      setInterval(() => registration.update(), CONFIG.UPDATE_INTERVAL);
      
      // Для Android - активация фоновой синхронизации
      if ('sync' in registration && state.isAndroid) {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            registration.sync.register('sync-data');
          }
        });
      }
    })
    .catch(error => {
      console.error('Ошибка регистрации SW:', error);
    });
  }
}

// Загрузка данных
async function loadInitialData() {
  showLoader();
  
  try {
    const [networkData, cachedData] = await Promise.all([
      fetchData(CONFIG.API_URL),
      getCachedData()
    ]);
    
    // Используем сетевые данные если есть, иначе кэш
    const dataToShow = networkData || cachedData;
    
    if (dataToShow) {
      renderData(dataToShow);
      state.lastUpdate = Date.now();
      
      // Если есть сетевые данные - обновляем кэш
      if (networkData) {
        await cacheData(networkData);
        showNotification('Данные обновлены');
      } else if (cachedData) {
        showNotification('Используются кэшированные данные');
      }
    } else {
      showError('Нет данных для отображения');
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    showError('Ошибка загрузки данных');
  } finally {
    hideLoader();
    scheduleNextUpdate();
  }
}

// Работа с данными
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка сети');
    return response.json();
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    return null;
  }
}

async function getCachedData() {
  if ('caches' in window) {
    try {
      const cache = await caches.open(API_CACHE_NAME);
      const response = await cache.match(CONFIG.API_URL);
      return response ? response.json() : null;
    } catch (error) {
      console.error('Ошибка чтения кэша:', error);
      return null;
    }
  }
  return null;
}

async function cacheData(data) {
  if ('caches' in window) {
    try {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(
        CONFIG.API_URL,
        new Response(JSON.stringify(data))
      );
    } catch (error) {
      console.error('Ошибка кэширования:', error);
    }
  }
}

// Отображение данных
function renderData(data) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  appContainer.innerHTML = `
    <div class="content">
      <h2>${data.title || 'Без названия'}</h2>
      <p>${data.content || 'Нет содержимого'}</p>
      <div class="meta">
        <small>Обновлено: ${new Date().toLocaleString()}</small>
        ${state.isOnline ? '' : '<span class="offline-badge">Офлайн</span>'}
      </div>
    </div>
  `;
}

// Обработчики событий
function setupEventListeners() {
  // Сетевое соединение
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Сообщения от Service Worker
  navigator.serviceWorker?.addEventListener('message', handleSWMessage);
  
  // Обновление по кнопке
  document.getElementById('refresh-btn')?.addEventListener('click', loadInitialData);
}

function handleOnline() {
  state.isOnline = true;
  document.body.classList.remove('offline');
  loadInitialData();
}

function handleOffline() {
  state.isOnline = false;
  document.body.classList.add('offline');
  showNotification('Вы перешли в офлайн-режим');
}

function handleSWMessage(event) {
  if (event.data.type === 'content-updated') {
    showNotification('Данные обновлены в фоне');
    loadInitialData();
  }
}

// iOS специфика
function setupIOSHandlers() {
  // Принудительное обновление при открытии
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadInitialData();
    }
  });
  
  // Обработка добавления на домашний экран
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    showIOSInstallPrompt();
  });
}

// Android специфика
function setupAndroidHandlers() {
  // Обработка обновлений
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Вспомогательные функции
function showLoader() {
  document.getElementById('loader')?.classList.add('active');
}

function hideLoader() {
  document.getElementById('loader')?.classList.remove('active');
}

function showNotification(message, duration = 3000) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, duration);
}

function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}

function scheduleNextUpdate() {
  setTimeout(loadInitialData, CONFIG.UPDATE_INTERVAL);
}

// Публичное API (если нужно)
window.OTZApp = {
  refresh: loadInitialData,
  getState: () => state
};
