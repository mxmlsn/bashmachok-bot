export default async function handler(req, res) {
  // 1. Проверка безопасности (чтобы никто другой не дергал вашу ссылку)
  // Vercel автоматически добавляет этот заголовок при запуске Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Для локальных тестов можно закомментировать эти три строки ниже
    // return res.status(401).json({ success: false });
  }

  // 2. Ваш список фраз
  const phrases = [
    "пора менять лоток итд",
    "ребята воняет сильно поменяйте пожалуйста",
    "поменяли уже?",
    "пора лоточек обновить",
    "он покакал",
    "чья сейчас очередь я забыл",
    "аааа орэшки бигбоп(поменяйте лоток)"
  ];

  // 3. Выбираем случайную фразу
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  // 4. Отправляем в Telegram
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: randomPhrase
      })
    });

    return res.status(200).json({ success: true, message: "Message sent!" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const config = {
  runtime: 'edge', // Делает запуск быстрее и дешевле
};