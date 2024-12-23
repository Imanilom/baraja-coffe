import { Xendit } from 'xendit-node';

const xendit = new Xendit({
  secretKey: process.env.XENDIT_TOKEN, // Ganti dengan API Key dari Xendit
});

export const { EWallet, Invoice, QRCode } = xendit;
