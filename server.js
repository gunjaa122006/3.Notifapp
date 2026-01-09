const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const HOST = '127.0.0.1'; // Changed to 127.0.0.1 for better Windows compatibility

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Prevent directory traversal attacks
    const absolutePath = path.resolve(__dirname, filePath);
    if (!absolutePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Forbidden</h1>', 'utf-8');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`   └─ 404 Not Found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1><p>The requested file could not be found.</p>', 'utf-8');
            } else if (error.code === 'EISDIR') {
                console.log(`   └─ 403 Directory: ${filePath}`);
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.end('<h1>403 - Forbidden</h1><p>Cannot serve directories.</p>', 'utf-8');
            } else {
                console.log(`   └─ 500 Error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            console.log(`   └─ 200 OK (${content.length} bytes)`);
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (err) => {
    console.error('\n❌ Server Error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${PORT} is already in use!`);
        console.error('   Solutions:');
        console.error('   1. Close other applications using this port');
        console.error('   2. Use a different port: set PORT=8001 && node server.js');
        console.error('   3. Kill the process: netstat -ano | findstr :8000');
    } else if (err.code === 'EACCES') {
        console.error(`\n⚠️  Permission denied to use port ${PORT}`);
        console.error('   Try using a port number above 1024');
    }
    process.exit(1);
});

server.listen(PORT, HOST, () => {
    console.clear();
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Server Started Successfully!      ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log(`📡 Server is running on:\n`);
    console.log(`   • http://localhost:${PORT}`);
    console.log(`   • http://127.0.0.1:${PORT}`);
    console.log(`\n📂 Serving files from:\n   ${__dirname}\n`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Request Log:\n');
    console.log('Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Server terminated');
    server.close(() => {
        process.exit(0);
    });
});
