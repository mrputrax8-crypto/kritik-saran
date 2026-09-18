const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Header CORS agar aman
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Environment variables belum disetel di Vercel.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { nama, is_anonim, rating, pesan } = req.body || {};

  if (!rating || !pesan) {
    return res.status(400).json({ error: 'Rating dan kritik saran wajib diisi.' });
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Nilai rating tidak valid.' });
  }

  const finalName = Boolean(is_anonim) ? 'Anonim' : String(nama || '').trim();
  if (!finalName) {
    return res.status(400).json({ error: 'Nama wajib diisi jika bukan mode anonim.' });
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          nama: finalName.slice(0, 100),
          is_anonim: Boolean(is_anonim),
          rating: ratingNum,
          pesan: String(pesan).slice(0, 1000)
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: 'Database Error: ' + error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
};
