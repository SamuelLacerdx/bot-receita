import 'dotenv/config';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const ENDPOINT    = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/responses\/?$/, '') + '/responses';
const API_KEY     = process.env.AZURE_API_KEY;
const API_VERSION = '2025-11-15-preview';

const sessoes = new Map();

async function chamarAgente(userMsg, previousResponseId = null) {
  const body = {
    input: userMsg,
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
  };

  const resp = await fetch(`${ENDPOINT}?api-version=${API_VERSION}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  if (!resp.ok) {
    const err = new Error(text);
    err.status = resp.status;
    throw err;
  }
  return JSON.parse(text);
}

function extrairTexto(data) {
  const mensagens = (data?.output ?? []).filter(
    item => item.type === 'message' && item.role === 'assistant' && item.status === 'completed'
  );
  for (const msg of mensagens) {
    for (const c of msg?.content ?? []) {
      if (c.type === 'output_text' && c.text?.trim()) return c.text.trim();
    }
  }
  const qualquer = (data?.output ?? []).filter(
    item => item.type === 'message' && item.role === 'assistant'
  );
  for (const msg of qualquer) {
    for (const c of msg?.content ?? []) {
      if ((c.type === 'output_text' || c.type === 'text') && c.text?.trim()) return c.text.trim();
    }
  }
  if (data.output_text?.trim()) return data.output_text.trim();
  return '(sem resposta)';
}

// ── Conversor Markdown → HTML do Telegram ────────────────────────────────────

function escaparHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineHTML(texto) {
  return escaparHTML(texto)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*(.+?)\*\*/g,     '<b>$1</b>')
    .replace(/\*(.+?)\*/g,         '<i>$1</i>')
    .replace(/__(.+?)__/g,         '<b>$1</b>')
    .replace(/_(.+?)_/g,           '<i>$1</i>')
    .replace(/`(.+?)`/g,           '<code>$1</code>');
}

function markdownParaHTML(md) {
  const linhas = md.split('\n');
  const out = [];
  let cabecalho = [];
  let emTabela  = false;

  for (const linha of linhas) {
    const l = linha.trimEnd();

    // ── Tabela ──────────────────────────────────────────────
    if (l.trimStart().startsWith('|')) {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean);

      // Linha separadora |---|---|
      if (cols.every(c => /^[-: ]+$/.test(c))) continue;

      if (!emTabela) {
        emTabela  = true;
        cabecalho = cols;
        continue;
      }

      // Linha de dados
      const partes = cols.map((val, i) => {
        const key = cabecalho[i] ?? '';
        const v   = inlineHTML(val);
        return key ? `<b>${escaparHTML(key)}:</b> ${v}` : v;
      });
      out.push('▸ ' + partes.join('  |  '));
      continue;
    }

    emTabela  = false;
    cabecalho = [];

    // ── Títulos ─────────────────────────────────────────────
    const tituloMatch = l.match(/^(#{1,3})\s+(.+)/);
    if (tituloMatch) {
      out.push(`\n<b>${inlineHTML(tituloMatch[2])}</b>`);
      continue;
    }

    // ── Listas com marcador ──────────────────────────────────
    const listaMatch = l.match(/^(\s*)[-*]\s+(.+)/);
    if (listaMatch) {
      const indent = listaMatch[1].length > 0 ? '    ' : '';
      out.push(`${indent}• ${inlineHTML(listaMatch[2])}`);
      continue;
    }

    // ── Listas numeradas ─────────────────────────────────────
    const numMatch = l.match(/^(\s*)\d+\.\s+(.+)/);
    if (numMatch) {
      out.push(`${numMatch[1]}${l.replace(/^(\s*\d+\.\s+)(.+)/, (_, p, rest) => p + inlineHTML(rest))}`);
      continue;
    }

    // ── Linha vazia ──────────────────────────────────────────
    if (l.trim() === '') {
      out.push('');
      continue;
    }

    // ── Parágrafo normal ─────────────────────────────────────
    out.push(inlineHTML(l));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Telegram aceita no máximo 4096 chars por mensagem
async function responderEmPartes(ctx, html) {
  const MAX = 4000;
  if (html.length <= MAX) {
    await ctx.reply(html, { parse_mode: 'HTML' });
    return;
  }
  // Divide em partes sem cortar tags
  const partes = [];
  let restante = html;
  while (restante.length > MAX) {
    const corte = restante.lastIndexOf('\n', MAX);
    const pos   = corte > 0 ? corte : MAX;
    partes.push(restante.slice(0, pos));
    restante = restante.slice(pos).trimStart();
  }
  partes.push(restante);
  for (const parte of partes) {
    await ctx.reply(parte, { parse_mode: 'HTML' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

bot.start(async ctx => {
  sessoes.delete(ctx.from.id);
  await ctx.reply(
    '🌍 Olá! Sou o <b>LeoTurismo</b>, seu assistente de viagens!\n\n' +
    'Posso te ajudar com:\n' +
    '• Destinos e roteiros\n' +
    '• Dicas de hospedagem e transporte\n' +
    '• Informações sobre atrações turísticas\n\n' +
    'Me diga: para onde você quer viajar? ✈️',
    { parse_mode: 'HTML' }
  );
});

bot.command('reset', async ctx => {
  sessoes.delete(ctx.from.id);
  await ctx.reply('🔄 Conversa reiniciada! Como posso te ajudar?');
});

bot.on('text', async ctx => {
  const userId  = ctx.from.id;
  const userMsg = ctx.message.text;
  if (userMsg.startsWith('/')) return;

  await ctx.sendChatAction('typing');

  try {
    const data = await chamarAgente(userMsg, sessoes.get(userId) ?? null);
    if (data.id) sessoes.set(userId, data.id);

    const markdown = extrairTexto(data);
    const html     = markdownParaHTML(markdown);
    await responderEmPartes(ctx, html);

  } catch (e) {
    const status = e?.status;
    const msg    = e?.message ?? String(e);
    console.error(`Erro [${status}]:`, msg.slice(0, 400));

    if      (status === 401) await ctx.reply('❌ Erro de autenticação.');
    else if (status === 403) await ctx.reply('❌ Sem permissão para acessar o agente.');
    else if (status === 404) await ctx.reply('❌ Agente não encontrado.');
    else if (status === 429) await ctx.reply('⏳ Limite atingido. Aguarde e tente novamente.');
    else await ctx.reply(`⚠️ Erro ${status ?? ''}: ${msg.slice(0, 200)}`);
  }
});

console.log('🔗 Endpoint:', ENDPOINT);

bot
  .launch()
  .then(() => console.log('✅ Bot LeoTurismo iniciado!'))
  .catch(err => { console.error('❌ Falha ao iniciar:', err); process.exit(1); });

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));