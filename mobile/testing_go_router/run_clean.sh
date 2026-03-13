#!/bin/bash

# Script untuk menjalankan Flutter dengan log yang lebih bersih
# Menyembunyikan warning IMGMapper yang mengganggu

echo "🚀 Menjalankan Flutter dengan filtered logs..."
echo "📝 Warning IMGMapper akan disembunyikan"
echo ""

# Jalankan flutter dan filter output
flutter run 2>&1 | grep -v -E "(IMGMapper|SMPTE2086|CTA861_3|SMPTE2094_40)"
