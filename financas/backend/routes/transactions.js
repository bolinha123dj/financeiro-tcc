const express  = require('express');
const supabase = require('../config/supabase');
const auth     = require('../middleware/auth');

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(auth);

/* ── GET /api/transactions ──────────────────────────────── */
router.get('/', async (req, res) => {
  const { type, category, month, year, search } = req.query;

  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type && type !== 'all') query = query.eq('type', type);
    if (category)               query = query.eq('category', category);

    if (month && year) {
      const m  = String(month).padStart(2, '0');
      const y  = String(year);
      query = query
        .gte('date', `${y}-${m}-01`)
        .lte('date', `${y}-${m}-31`);
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('transactions.list:', err.message);
    res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
});

/* ── GET /api/transactions/summary ─────────────────────── */
router.get('/summary', async (req, res) => {
  const { month, year } = req.query;

  try {
    let query = supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.userId);

    if (month && year) {
      const m = String(month).padStart(2, '0');
      const y = String(year);
      query = query
        .gte('date', `${y}-${m}-01`)
        .lte('date', `${y}-${m}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const income  = data.filter(t => t.type === 'income' ).reduce((s, t) => s + Number(t.amount), 0);
    const expense = data.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    res.json({ income, expense, balance: income - expense });
  } catch (err) {
    console.error('transactions.summary:', err.message);
    res.status(500).json({ error: 'Erro ao calcular resumo.' });
  }
});

/* ── POST /api/transactions ─────────────────────────────── */
router.post('/', async (req, res) => {
  const { description, amount, type, category, date } = req.body;

  if (!description || !amount || !type || !category || !date)
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  if (!['income', 'expense'].includes(type))
    return res.status(400).json({ error: 'Tipo inválido. Use "income" ou "expense".' });

  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'O valor deve ser maior que zero.' });

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id:     req.userId,
        description: description.trim(),
        amount:      Number(amount),
        type,
        category,
        date,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('transactions.create:', err.message);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
});

/* ── PUT /api/transactions/:id ──────────────────────────── */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, type, category, date } = req.body;

  try {
    // Verifica se a transação pertence ao usuário
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!existing)
      return res.status(404).json({ error: 'Transação não encontrada.' });

    const updates = {};
    if (description) updates.description = description.trim();
    if (amount)      updates.amount      = Number(amount);
    if (type)        updates.type        = type;
    if (category)    updates.category    = category;
    if (date)        updates.date        = date;

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('transactions.update:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
});

/* ── DELETE /api/transactions/:id ───────────────────────── */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!existing)
      return res.status(404).json({ error: 'Transação não encontrada.' });

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error('transactions.delete:', err.message);
    res.status(500).json({ error: 'Erro ao excluir transação.' });
  }
});

module.exports = router;
