// --- Canada Post Rate API (Debug Version) ---
app.post('/api/canadapost-rate', async (req, res) => {
  const { postal, country, weight, length, width, height } = req.body;

  console.log('Received request for shipping rates:', req.body);

  // Validate fields
  if (!postal || !weight || !length || !width || !height) {
    console.error('Missing fields:', { postal, weight, length, width, height });
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Build XML
    const xml = `
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <customer-number>0001223271</customer-number>
  <parcel-characteristics>
    <weight>${weight}</weight>
    <dimensions>
      <length>${length}</length>
      <width>${width}</width>
      <height>${height}</height>
    </dimensions>
  </parcel-characteristics>
  <origin-postal-code>M5V3L9</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${postal}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>
`;

    console.log('Sending XML to Canada Post:', xml);

    const response = await fetch(CANADAPOST_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${CANADAPOST_USERNAME}:${CANADAPOST_PASSWORD}`).toString('base64'),
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml'
      },
      body: xml
    });

    const text = await response.text();
    console.log('Canada Post raw response:', text);

    if (!response.ok) {
      return res.status(500).json({ error: 'Canada Post API error', details: text });
    }

    // Minimal parsing
    const rates = [];
    const regex = /<service-name>(.*?)<\/service-name>[\s\S]*?<price>(.*?)<\/price>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      rates.push({ name: match[1], price: parseFloat(match[2]) });
    }

    console.log('Parsed rates:', rates);
    res.json(rates);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});
