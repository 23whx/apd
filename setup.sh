#!/bin/bash

# APD Project Setup Script

echo "🚀 ACGN Personality Database - Setup Script"
echo "==========================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""

# Check for .env files
echo "🔍 Checking environment files..."

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Creating from .env.example..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "📝 Please edit frontend/.env with your Supabase credentials"
    fi
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "📝 Please edit backend/.env with your API keys"
    fi
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure frontend/.env with Supabase credentials"
echo "2. Configure backend/.env with API keys"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - DEPLOYMENT.md - Deployment guide"
echo "   - 项目文档一/二/三.md - Chinese documentation"
echo ""
echo "🌐 Default URLs:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:3001"
echo ""

