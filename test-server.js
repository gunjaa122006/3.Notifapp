const http = require('http');

const server = http.createServer((req, res) => {
    console.log('Request received:', req.url);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Server is working!</h1><p>Node.js server is running correctly.</p>');
});

const PORT = 8000;

server.listen(PORT, '127.0.0.1', () => {
    console.log('================================');
    console.log(`Test server running on:`);
    console.log(`http://127.0.0.1:${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log('================================');
    console.log('Press Ctrl+C to stop');
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is busy. Try closing other applications.`);
    }
});
