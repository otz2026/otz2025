// Проверка поддержки PWA
const isPWA = () => window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone ||
                document.referrer.includes('android-app://');

// Обновление контента
async function updateContent() {
  try {
    const response = await fetch('/otz2025/api/content');
    if (!response.ok) throw new Error('Ошибка сети');
    
    const data = await response.json();
    updateUI(data);
    cacheData(data);
    return data;
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    return loadCachedData();
  }
}

function updateUI(data) {
  const contentEl = document.getElementById('dynamic-content');
  if (contentEl) {
    contentEl.innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.content}</p>
      <small>Обновлено: ${new Date(data.timestamp).toLocaleString()}</small>
    `;
  }
}

async function cacheData(data) {
  if ('caches' in window) {
    try {
      const cache = await caches.open('otz-dynamic');
      await cache.put(
        '/otz2025/api/content',
        new Response(JSON.stringify(data))
      );
    } catch (err) {
      console.error('Ошибка кэширования:', err);
    }
  }
}

async function loadCachedData() {
  try {
    const cache = await caches.open('otz-dynamic');
    const response = await cache.match('/otz2025/api/content');
    if (response) {
      return response.json();
    }
    return { title: "Офлайн-режим", content: "Нет соединения с сервером" };
  } catch (err) {
    console.error('Ошибка загрузки из кэша:', err);
    return { title: "Ошибка", content: "Не удалось загрузить данные" };
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Проверка PWA-режима
  if (isPWA()) {
    document.documentElement.classList.add('pwa-mode');
  }
  
  // Загрузка контента
  updateContent();
  
  // Периодическое обновление (каждые 5 минут)
  setInterval(updateContent, 300000);
});
