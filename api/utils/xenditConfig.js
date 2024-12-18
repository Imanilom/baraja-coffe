import { Xendit } from 'xendit-node';

const xendit = new Xendit({
  secretKey: 'YOUR_XENDIT_SECRET_KEY', // Ganti dengan API Key dari Xendit
});

export const { EWallet, Invoice, QRCode } = xendit;
