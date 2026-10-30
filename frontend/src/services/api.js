const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function graphqlQuery(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const authToken = token || localStorage.getItem('library_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 401) {
    localStorage.removeItem('library_token');
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    const errMsg = json.errors[0].message || 'GraphQL Error';
    if (errMsg.includes('Expired') || errMsg.includes('JWT') || errMsg.includes('token')) {
      localStorage.removeItem('library_token');
    }
    throw new Error(errMsg);
  }
  return json.data;
}

export async function restLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Đăng nhập không thành công');
  }
  return await res.json();
}

export async function restRegister(userData) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Đăng ký không thành công');
  }
  return await res.json();
}

export async function restGoogleLogin(googleData) {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googleData),
  });
  if (!res.ok) {
    throw new Error('Đăng nhập Google thất bại');
  }
  return await res.json();
}

export async function restFacebookLogin(facebookData) {
  const res = await fetch(`${BASE_URL}/api/auth/facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(facebookData),
  });
  if (!res.ok) {
    throw new Error('Đăng nhập Facebook thất bại');
  }
  return await res.json();
}


export async function createVNPayUrl(recordId, amount) {
  const token = localStorage.getItem('library_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/vnpay/create-payment?recordId=${recordId || ''}&amount=${amount}`, {
    headers,
  });
  if (!res.ok) throw new Error('Không thể tạo liên kết VNPay');
  return await res.json();
}

export async function createSepayQR(recordId, amount) {
  const token = localStorage.getItem('library_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/sepay/create-payment?recordId=${recordId || ''}&amount=${amount}`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Không thể tạo mã VietQR SePay');
  return await res.json();
}

export async function checkSepayStatus(transactionId) {
  const res = await fetch(`${BASE_URL}/api/sepay/status/${transactionId}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function processVNPayReturn(queryString) {
  const res = await fetch(`${BASE_URL}/api/vnpay/payment-return${queryString}`);
  if (!res.ok) throw new Error('Xử lý phản hồi VNPay thất bại');
  return await res.json();
}

export async function getSystemSettings() {
  const res = await fetch(`${BASE_URL}/api/settings`);
  if (!res.ok) return null;
  return await res.json();
}

export async function getSystemStats() {
  try {
    const res = await fetch(`${BASE_URL}/api/settings/stats`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function incrementSearchHits() {
  try {
    await fetch(`${BASE_URL}/api/settings/increment-search`, { method: 'POST' });
  } catch (e) {
    // silent
  }
}

export async function updateSystemSettings(settings) {
  const token = localStorage.getItem('library_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Không thể cập nhật cấu hình hệ thống');
  return await res.json();
}

export async function testDatabase(dbParams = null) {
  if (dbParams) {
    const res = await fetch(`${BASE_URL}/api/settings/test-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbParams),
    });
    return await res.json();
  }
  const res = await fetch(`${BASE_URL}/api/settings/test-db`);
  return await res.json();
}


export async function testCloudflare(apiKey, zoneId) {
  const res = await fetch(`${BASE_URL}/api/settings/test-cloudflare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, zoneId }),
  });
  return await res.json();
}

export async function testGeminiApi(apiKey, model) {
  const res = await fetch(`${BASE_URL}/api/settings/test-gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, model }),
  });
  return await res.json();
}

export async function testOAuth(provider, clientId, clientSecret) {
  const res = await fetch(`${BASE_URL}/api/settings/test-oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, clientId, clientSecret }),
  });
  return await res.json();
}


