#!/bin/bash

# ============================================================================
# AIT-CONNECTOR Setup Script
# Automated setup for development environment
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
  ╔═══════════════════════════════════════════════╗
  ║                                                ║
  ║            AIT-CONNECTOR SETUP                 ║
  ║     Module Connection System for ERP           ║
  ║                                                ║
  ╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check Node.js version
log_info "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version must be 18.x or higher. Current: $(node -v)"
    exit 1
fi
log_success "Node.js $(node -v) detected"

# Check npm
log_info "Checking npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi
log_success "npm $(npm -v) detected"

# Install pnpm if not present
log_info "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    log_warning "pnpm not found. Installing..."
    npm install -g pnpm
    log_success "pnpm installed"
else
    log_success "pnpm $(pnpm -v) detected"
fi

# Install dependencies
log_info "Installing dependencies..."
pnpm install
log_success "Dependencies installed"

# Create environment file
log_info "Creating environment configuration..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# AIT-CONNECTOR Environment Configuration

# Node Environment
NODE_ENV=development

# Server
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ait_connector
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=ait:

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=ait-connector

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Features
ENABLE_HOT_RELOAD=true
ENABLE_TELEMETRY=true
ENABLE_MARKETPLACE=true

# Module Loader
MODULE_TIMEOUT=30000
MODULE_RETRY=3
MODULE_CACHE=true

# Performance
MAX_MODULES=100
MAX_MEMORY_PER_MODULE=1024

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF
    log_success ".env file created"
else
    log_warning ".env file already exists, skipping"
fi

# Build project
log_info "Building project..."
pnpm run build
log_success "Project built successfully"

# Run tests
log_info "Running tests..."
pnpm test
log_success "All tests passed"

# Setup git hooks
log_info "Setting up git hooks..."
if [ -d ".git" ]; then
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
pnpm run lint
pnpm run format:check
EOF
    chmod +x .git/hooks/pre-commit
    log_success "Git hooks configured"
else
    log_warning "Not a git repository, skipping git hooks"
fi

# Setup complete
echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║                                                ║
║         SETUP COMPLETED SUCCESSFULLY! 🎉      ║
║                                                ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Next steps:"
echo -e "  1. Start development server: ${BLUE}pnpm run dev${NC}"
echo -e "  2. Run tests: ${BLUE}pnpm test${NC}"
echo -e "  3. Build for production: ${BLUE}pnpm run build${NC}"
echo -e "  4. Start with Docker: ${BLUE}docker-compose up${NC}"

log_info "Documentation: https://github.com/ramakjama/AIT-CONNECTOR#readme"

exit 0
