const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../config/supabase');
const auth     = require('../middleware/auth');

const router = express.Router();

/* ── helpers ────────────────────────────────────────────── */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

/* ── POST /api/auth/register ────────────────────────────── */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });

  try {
    // Verifica se email já existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing)
      return res.status(409).json({ error: 'Este email já está cadastrado.' });

    const hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), email: email.toLowerCase(), password: hash })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ token: generateToken(user.id), user: safeUser(user) });
  } catch (err) {
    console.error('register:', err.message);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

/* ── POST /api/auth/login ───────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Email ou senha incorretos.' });

    res.json({ token: generateToken(user.id), user: safeUser(user) });
  } catch (err) {
    console.error('login:', err.message);
    res.status(500).json({ error: 'Erro interno ao fazer login.' });
  }
});

/* ── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user)
      return res.status(404).json({ error: 'Usuário não encontrado.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

/* ── PUT /api/auth/profile ──────────────────────────────── */
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email)
    return res.status(400).json({ error: 'Informe nome ou email para atualizar.' });

  const updates = {};
  if (name)  updates.name  = name.trim();
  if (email) updates.email = email.toLowerCase();

  try {
    // Checar duplicata de email
    if (email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', req.userId)
        .single();

      if (existing)
        return res.status(409).json({ error: 'Este email já está em uso.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select('id, name, email, created_at')
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (err) {
    console.error('profile:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

/* ── PUT /api/auth/password ─────────────────────────────── */
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.userId)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hash })
      .eq('id', req.userId);

    if (error) throw error;

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('password:', err.message);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

module.exports = router;
