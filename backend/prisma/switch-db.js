const fs = require('fs');
const path = require('path');

const target = process.argv[2];
const schemaPath = path.join(__dirname, 'schema.prisma');
const postgresPath = path.join(__dirname, 'schema.postgresql.prisma');

if (target === 'postgres') {
  if (fs.existsSync(postgresPath)) {
    fs.copyFileSync(postgresPath, schemaPath);
    console.log('Switched Prisma database provider to PostgreSQL (schema.prisma).');
    console.log('Ensure DATABASE_URL="postgresql://user:password@host:port/dbname" is set in your .env');
  }
} else if (target === 'sqlite') {
  let content = fs.readFileSync(schemaPath, 'utf8');
  content = content.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('Switched Prisma database provider to SQLite (file:./dev.db).');
} else {
  console.log('Usage: node switch-db.js [sqlite|postgres]');
}
