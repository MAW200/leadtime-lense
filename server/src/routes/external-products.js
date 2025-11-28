import express from 'express';

const router = express.Router();

const DEFAULT_BASE_URL = 'https://sapi.renoxpert.my/api/v1/products';

router.get('/', async (req, res) => {
  const baseUrl = process.env.EXTERNAL_PRODUCTS_API_URL || DEFAULT_BASE_URL;
  const token = process.env.EXTERNAL_PRODUCTS_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'External products API token is not configured' });
  }

  const params = new URLSearchParams({
    size: req.query.size ?? '10',
    page: req.query.page ?? '1',
    search: req.query.search ?? '',
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const payload = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({ error: payload });
    }

    res.type('application/json').send(payload);
  } catch (error) {
    console.error('External products proxy error:', error);
    res.status(502).json({ error: 'Unable to reach the external products service' });
  }
});

export default router;

