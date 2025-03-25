// Обновление контента
async function updateContent() {
  try {
    const response = await fetch('/otz2025/api/content');
    const data = await response.json();
    
    // Кэширование
    if ('caches' in window) {
      caches.open('otz-dynamic').then(cache => {
        cache.put('/otz2025/api/content', new Response(JSON.stringify(data)));
      });
    }
    
    // Обновление UI
    document.getElementById('dynamic-content').innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.content}</p>
      <small>Обновлено: ${new Date().toLocaleString()}</small>
    `;
    
    return data;
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    return caches.match('/otz2025/api/content').then(response => 
      response ? response.json() : {title: "Офлайн-режим", content: "Нет соединения с сервером"}
    );
  }
}

// Отправка данных
async function sendData(data) {
  try {
    const response = await fetch('/otz2025/api/update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Ошибка сервера');
    return response.json();
  } catch (err) {
    console.error('Ошибка отправки:', err);
    
    // Сохранение для фоновой синхронизации
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        caches.open('otz-pending').then(cache => {
          cache.put('/otz2025/pending', new Response(JSON.stringify(data)));
          reg.sync.register('sync-data');
        });
      });
    }
    
    return {status: 'pending', message: 'Данные будут отправлены позже'};
  }
}
