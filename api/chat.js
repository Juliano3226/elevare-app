

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { messages, system } = req.body;

    // Montar histórico para o Gemini
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const lastMessage = messages[messages.length - 1];

    const body = {
      system_instruction: { parts: [{ text: system }] },
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage.content }] }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API Gemini' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui processar. Tente novamente.';
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}
