const express  = require('express');
const supabase = require('../config/supabase');
const auth     = require('../middleware/auth');

const router = express.Router();

router.use(auth);

/* ── GET /api/goals ─────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('goals.list:', err.message);
    res.status(500).json({ error: 'Erro ao buscar metas.' });
  }
});

/* ── POST /api/goals ────────────────────────────────────── */
router.post('/', async (req, res) => {
  const { name, target_amount, current_amount = 0, deadline } = req.body;

  if (!name || !target_amount)
    return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios.' });

  if (Number(target_amount) <= 0)
    return res.status(400).json({ error: 'O valor alvo deve ser maior que zero.' });

  try {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id:        req.userId,
        name:           name.trim(),
        target_amount:  Number(target_amount),
        current_amount: Number(current_amount) || 0,
        deadline:       deadline || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('goals.create:', err.message);
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

/* ── PUT /api/goals/:id ─────────────────────────────────── */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, target_amount, current_amount, deadline } = req.body;

  try {
    const { data: existing } = await supabase
      .from('goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!existing)
      return res.status(404).json({ error: 'Meta não encontrada.' });

    const updates = {};
    if (name !== undefined)           updates.name           = name.trim();
    if (target_amount !== undefined)  updates.target_amount  = Number(target_amount);
    if (current_amount !== undefined) updates.current_amount = Number(current_amount);
    if (deadline !== undefined)       updates.deadline       = deadline || null;

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('goals.update:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

/* ── DELETE /api/goals/:id ──────────────────────────────── */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing } = await supabase
      .from('goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!existing)
      return res.status(404).json({ error: 'Meta não encontrada.' });

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error('goals.delete:', err.message);
    res.status(500).json({ error: 'Erro ao excluir meta.' });
  }
});

module.exports = router;
