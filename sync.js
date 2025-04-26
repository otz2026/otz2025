// Отправка изменений на сервер
async function sendUpdate(text) {
  const response = await fetch('/api/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: text })
  });
  
  if (!response.ok) {
    // Сохраняем для отправки позже
    const pending = JSON.parse(localStorage.getItem('pendingUpdates') || [];
    pending.push(text);
    localStorage.setItem('pendingUpdates', JSON.stringify(pending));
  }
}

// Проверка pending updates
async function checkPendingUpdates() {
  const pending = JSON.parse(localStorage.getItem('pendingUpdates'));
  if (pending && pending.length > 0) {
    for (const update of pending) {
      await sendUpdate(update);
    }
    localStorage.removeItem('pendingUpdates');
  }
}

// Для iOS (Background Fetch)
if ('backgroundFetch' in navigator) {
  navigator.backgroundFetch.register('updates', ['/api/update'], {
    title: 'Обновление контента',
    icons: [{ src: '/img/icon-192x192.png', sizes: '192x192' }]
  });
}
