import express from 'express';
import logger from './logger';

const app = express();

const services = [
{ route: "/main", target: "https://example.com/main" },
];

services.forEach(({ route, target }) => {
app.use(
route,
createProxyMiddleware({
target,
changeOrigin: true,
pathRewrite: { [`^${route}`]: "" },
})
);
});

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`API Gateway running on port ${PORT}`);
});

const rateLimit = {};
const MAX_REQUESTS = 20;
const TIME_WINDOW = 60 * 1000;

setInterval(() => (Object.keys(rateLimit).forEach(ip => (rateLimit[ip] = 0))), TIME_WINDOW);

app.use((req, res, next) => {
const ip = req.ip;

rateLimit[ip] = (rateLimit[ip] || 0) + 1;

if (rateLimit[ip] > MAX_REQUESTS) {
return res.status(429).json({ error: "Rate limit exceeded" });
}

req.setTimeout(15000, () => {
res.status(504).json({ error: "Request timed out" });
req.abort();
});

next();
});