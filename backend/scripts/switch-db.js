const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'sqlite';
const candidatePaths = [
  path.join(__dirname, 'schema.prisma'),
  path.join(__dirname, '../prisma/schema.prisma')
];

let schemaPath = candidatePaths.find(p => fs.existsSync(p));

if (!schemaPath) {
  console.error('schema.prisma not found!');
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgres' || target === 'postgresql') {
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, content);
  console.log('Switched Prisma schema to PostgreSQL for Cloud Hosting!');
} else {
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content);
  console.log('Switched Prisma schema to SQLite for Local Dev!');
}
