import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateJokes() {
  try {
    // Читаем текущие анекдоты
    const jokesPath = path.join(__dirname, '..', 'jokes.json');
    const jokesData = JSON.parse(fs.readFileSync(jokesPath, 'utf-8'));
    
    // Читаем исходный файл с анекдотами для контекста
    const anekPath = path.join(__dirname, '..', 'anek.txt');
    const anekText = fs.readFileSync(anekPath, 'utf-8');
    
    // Берем небольшую выборку анекдотов для промпта
    const anekLines = anekText.split('\n');
    const sampleAnekdotes = anekLines
      .filter(line => line.includes('—') || line.includes('–'))
      .slice(0, 15)
      .join('\n');
    
    console.log('Generating 7 new jokes about Bashmachok...');
    
    // Генерируем новые анекдоты через OpenRouter API
    const prompt = `Ты пишешь короткие анекдоты про кота Башмачка в стиле русских исторических анекдотов. 

КОНТЕКСТ:
- Кот: Башмачок, серый (русская голубая или похожий), жёлто-зелёные глаза
- Хозяин: Максим, живёт в Париже, работает на себя
- Стиль: сухой юмор, ироничный, как в дореволюционных анекдотах

ПРИМЕРЫ СТИЛЯ из исторических анекдотов:
${sampleAnekdotes}

СУЩЕСТВУЮЩИЕ АНЕКДОТЫ ПРО БАШМАЧКА (не повторяй темы):
${jokesData.jokes.slice(-7).join('\n\n---\n\n')}

Сгенерируй ровно 7 НОВЫХ коротких анекдотов про Башмачка в том же стиле. Каждый анекдот должен:
- Быть коротким (3-5 предложений)
- Иметь сухой, ироничный тон
- Отражать кошачью психологию и отношения кот-хозяин
- НЕ повторять темы уже существующих анекдотов
- Быть написан строчными буквами (кроме имён и начала предложений)
- НЕ использовать эмодзи
- Содержать тонкий юмор, а не очевидные шутки

Верни ТОЛЬКО чистый JSON массив из 7 анекдотов без дополнительного текста: ["анекдот1", "анекдот2", ...]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/maximlyashenko/bashmachok-bot',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI Response:', content);
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse jokes from AI response');
    }
    
    const newJokes = JSON.parse(jsonMatch[0]);
    
    console.log(`Generated ${newJokes.length} new jokes`);
    
    // Добавляем новые анекдоты к существующим
    jokesData.jokes.push(...newJokes);
    jokesData.lastGenerated = new Date().toISOString();
    jokesData.generationCount = (jokesData.generationCount || 1) + 1;
    
    // Сохраняем обновленный файл
    fs.writeFileSync(jokesPath, JSON.stringify(jokesData, null, 2), 'utf-8');
    
    console.log(`Success! Total jokes: ${jokesData.jokes.length}`);
    console.log('New jokes:', newJokes);
    
  } catch (error) {
    console.error('Error generating jokes:', error);
    process.exit(1);
  }
}

generateJokes();
