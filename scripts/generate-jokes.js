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
    
    // Читаем исходный файл с анекдотами
    const anekPath = path.join(__dirname, '..', 'anek.txt');
    const anekText = fs.readFileSync(anekPath, 'utf-8');
    
    // Берем весь файл с анекдотами
    console.log('Generating 7 new jokes about Bashmachok...');
    
    // Промпт для AI - просто заменить героя на Башмачка
    const prompt = `Ты адаптируешь дореволюционные русские анекдоты, заменяя главного героя на кота Башмачка.

ПРАВИЛА:
1. Бери ОРИГИНАЛЬНЫЕ анекдоты из предоставленного текста
2. НЕ придумывай новые анекдоты
3. Просто ЗАМЕНИ главного героя (императора, генерала, графа и т.д.) на Башмачка
4. СОХРАНИ весь текст анекдота как есть, меняя только:
   - Имя главного героя → Башмачок
   - Титулы при необходимости (император → кот, генерал → Башмачок и т.п.)
   - Минимальные адаптации чтобы текст был связным (например "царь" → "Башмачок")
5. НЕ меняй структуру, диалоги, концовки анекдотов
6. Выбирай короткие анекдоты (не длиннее 5-7 предложений)

ИСХОДНЫЙ ТЕКСТ С АНЕКДОТАМИ:
${anekText.slice(0, 20000)}

СУЩЕСТВУЮЩИЕ УЖЕ АДАПТИРОВАННЫЕ АНЕКДОТЫ (не бери их источники повторно):
${jokesData.jokes.join('\n\n---\n\n')}

Выбери 7 РАЗНЫХ анекдотов из исходного текста и адаптируй их, заменив главного героя на Башмачка.
Сохрани оригинальный стиль, текст и структуру анекдотов.

Верни ТОЛЬКО чистый JSON массив из 7 анекдотов: ["анекдот1", "анекдот2", ...]`;

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
        temperature: 0.3,
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
