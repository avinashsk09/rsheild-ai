import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export async function analyzeUrl(url) {
  const response = await apiClient.post('/analyze/url', { url });
  return response.data;
}

export async function analyzeQr(payload) {
  const response = await apiClient.post('/analyze/qr', { payload });
  return response.data;
}

export async function analyzeMessage(message) {
  const response = await apiClient.post('/analyze/message', { message });
  return response.data;
}

export async function checkHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

export async function getMetrics() {
  const response = await apiClient.get('/metrics');
  return response.data;
}
