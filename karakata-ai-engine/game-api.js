require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. REGISTER PLAYER
app.post('/api/v1/game/player', async (req, res) => {
  try {
    const { username } = req.body;
    let { data: player } = await supabase.from('game_players').select('*').eq('username', username).single();
    if (!player) {
      const { data: newP } = await supabase.from('game_players').insert([{ username }]).select().single();
      player = newP;
      await supabase.from('game_wallets').insert([{ player_id: player.id, balance: 1000 }]);
    }
    const { data: wallet } = await supabase.from('game_wallets').select('*').eq('player_id', player.id).single();
    res.status(201).json({ success: true, player, wallet });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 2. MILESTONES (EARN/SPEND)
app.post('/api/v1/game/milestone', async (req, res) => {
  try {
    const { player_id, description, amount } = req.body;
    const { data: wallet } = await supabase.from('game_wallets').select('*').eq('player_id', player_id).single();
    const newBalance = Number(wallet.balance) + Number(amount);
    if (newBalance < 0) return res.status(400).json({ success: false, error: 'Insufficient KARA coins!' });
    await supabase.from('game_wallets').update({ balance: newBalance }).eq('player_id', player_id);
    res.status(201).json({ success: true, new_balance: newBalance });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 3. SHOP & INVENTORY
app.get('/api/v1/game/shop', async (req, res) => {
  const { data } = await supabase.from('game_items').select('*');
  res.json({ success: true, items: data });
});

app.post('/api/v1/game/buy', async (req, res) => {
  try {
    const { player_id, item_id } = req.body;
    const { data: item } = await supabase.from('game_items').select('*').eq('id', item_id).single();
    const { data: wallet } = await supabase.from('game_wallets').select('*').eq('player_id', player_id).single();
    if (Number(wallet.balance) < Number(item.price)) return res.status(400).json({ error: 'Not enough KARA!' });
    
    await supabase.from('game_wallets').update({ balance: Number(wallet.balance) - Number(item.price) }).eq('player_id', player_id);
    await supabase.from('game_inventory').insert([{ player_id, item_id }]);
    const { data: newWallet } = await supabase.from('game_wallets').select('balance').eq('player_id', player_id).single();
    res.json({ success: true, message: `Bought ${item.name}!`, new_balance: newWallet.balance });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 4. REAL ESTATE
app.get('/api/v1/game/real-estate', async (req, res) => {
  const { data } = await supabase.from('game_real_estate').select('*, game_players(username)');
  res.json({ success: true, properties: data });
});

app.post('/api/v1/game/buy-estate', async (req, res) => {
  try {
    const { player_id, estate_id } = req.body;
    const { data: estate } = await supabase.from('game_real_estate').select('*').eq('id', estate_id).single();
    if (estate.owner_id) return res.status(400).json({ error: 'Property already owned by ' + (estate.game_players?.username || 'someone') + '!' });
    const { data: wallet } = await supabase.from('game_wallets').select('*').eq('player_id', player_id).single();
    if (Number(wallet.balance) < Number(estate.price)) return res.status(400).json({ error: 'Not enough KARA for real estate!' });
    
    await supabase.from('game_wallets').update({ balance: Number(wallet.balance) - Number(estate.price) }).eq('player_id', player_id);
    await supabase.from('game_real_estate').update({ owner_id: player_id }).eq('id', estate_id);
    const { data: newWallet } = await supabase.from('game_wallets').select('balance').eq('player_id', player_id).single();
    res.json({ success: true, message: `Bought ${estate.name}!`, new_balance: newWallet.balance });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 5. LEADERBOARD
app.get('/api/v1/game/leaderboard', async (req, res) => {
  const { data } = await supabase.from('game_wallets').select('balance, game_players(username)').order('balance', { ascending: false }).limit(10);
  res.json({ success: true, leaderboard: data });
});

// WEBSOCKETS
io.on('connection', (socket) => {
  socket.on('join', ({ playerId, username }) => { socket.data.playerId = playerId; socket.broadcast.emit('player_joined', { playerId, username }); });
  socket.on('move', ({ playerId, x, y }) => { socket.broadcast.emit('player_moved', { playerId, x, y }); });
  socket.on('chat', ({ username, message }) => { io.emit('chat_message', { username, message }); });
  socket.on('disconnect', () => { if (socket.data.playerId) socket.broadcast.emit('player_left', { playerId: socket.data.playerId }); });
});

const PORT = process.env.GAME_PORT || 3041;
server.listen(PORT, () => console.log('🎮 KaraVerse City Metaverse Engine running on http://localhost:' + PORT));
