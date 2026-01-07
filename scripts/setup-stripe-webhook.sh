#!/bin/bash

# Setup script for Stripe webhook forwarding in development
# This script helps set up local webhook testing with Stripe CLI

echo "🔧 Setting up Stripe Webhook for Local Development"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed."
    echo "   Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI is installed"
echo ""

# Check if logged in
echo "Checking Stripe CLI login status..."
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged into Stripe CLI"
    echo "   Run: stripe login"
    echo ""
    read -p "Do you want to login now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stripe login
    else
        echo "Please login first: stripe login"
        exit 1
    fi
fi

echo "✅ Logged into Stripe CLI"
echo ""

# Get the webhook signing secret
echo "Starting webhook forwarding..."
echo ""
echo "📋 IMPORTANT: When Stripe CLI starts, it will display a webhook signing secret."
echo "   Copy that secret (starts with whsec_) and update your .env file:"
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "Press Ctrl+C to stop webhook forwarding"
echo ""
echo "Starting webhook forwarding to: http://localhost:8080/payments/webhook"
echo ""

# Start webhook forwarding
stripe listen --forward-to localhost:8080/payments/webhook

