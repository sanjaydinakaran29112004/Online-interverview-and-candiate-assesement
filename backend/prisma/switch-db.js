const fs = require('fs');
const path = require('path');

const target = process.argv[2];
const schemaPath = path.join(__dirname, 'schema.prisma');
const postgresPath = path.join(__dirname, 'schema.postgresql.prisma');
const envPath = path.join(__dirname, '../.env');

if (target === 'postgres') {
  if (fs.existsSync(postgresPath)) {
    fs.copyFileSync(postgresPath, schemaPath);
    console.log('✔ Switched Prisma provider to PostgreSQL (schema.prisma).');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('file:./dev.db')) {
        console.log('⚠ NOTICE: Your .env currently has DATABASE_URL="file:./dev.db".');
        console.log('👉 Please paste your PostgreSQL connection string in backend/.env:');
        console.log('   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"');
      }
    }
  }
} else if (target === 'sqlite') {
  let content = fs.readFileSync(schemaPath, 'utf8');
  content = content.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('✔ Switched Prisma provider to SQLite (schema.prisma).');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (/DATABASE_URL="postgres[^"]*"/.test(envContent)) {
      envContent = envContent.replace(/DATABASE_URL="postgres[^"]*"/, 'DATABASE_URL="file:./dev.db"');
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('✔ Updated backend/.env to DATABASE_URL="file:./dev.db"');
    }
  }
} else {
  console.log('Usage: node switch-db.js [sqlite|postgres]');
}
