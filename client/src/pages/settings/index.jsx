import React, { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { 
  FaKey, 
  FaCreditCard, 
  FaGoogle, 
  FaBell, 
  FaMotorcycle, 
  FaSlidersH, 
  FaEye, 
  FaEyeSlash, 
  FaSave, 
  FaCopy, 
  FaCheck, 
  FaShieldAlt 
} from 'react-icons/fa';
import MessageAlert from '../../components/MessageAlert';

const SettingsIntegrationPage = () => {
  const [activeTab, setActiveTab] = useState('midtrans');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState('');

  // Notification alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [alertKey, setAlertKey] = useState(0);

  // Configuration state fields
  const [configs, setConfigs] = useState({
    // Midtrans
    midtransServerKey: '',
    midtransClientKey: '',
    midtransIsProduction: false,
    midtransWebhookSecret: '',

    // Google
    googleClientId: '',
    googleClientSecret: '',
    googleMapsApiKey: '',

    // Firebase
    fcmServerKey: '',
    fcmSenderId: '',
    fcmProjectId: '',

    // GoSend / Delivery
    gosendApiKey: '',
    gosendMerchantId: '',
    gosendIsProduction: false,

    // App & Operational
    useDiscountPrice: true,
    defaultTaxPercentage: 0,
    defaultServicePercentage: 0,
  });

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertKey(prev => prev + 1);
  };

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/app-config');
      if (res.data && res.data.data) {
        setConfigs(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (error) {
      console.error('Gagal mengambil pengaturan sistem:', error);
      showAlert('Gagal memuat pengaturan sistem. Menggunakan nilai bawaan.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleInputChange = (field, value) => {
    setConfigs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleShowKey = (field) => {
    setShowKeys(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/app-config/bulk', { settings: configs });
      if (res.data && res.data.success) {
        showAlert('Pengaturan integrasi & API key berhasil disimpan!', 'success');
      } else {
        showAlert('Terjadi kesalahan saat menyimpan pengaturan.', 'error');
      }
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
      showAlert(error.response?.data?.message || 'Gagal menyimpan pengaturan ke server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/webhook/midtrans`;

  const tabs = [
    { id: 'midtrans', label: 'Midtrans Payment', icon: FaCreditCard, color: 'text-blue-600' },
    { id: 'google', label: 'Google Services', icon: FaGoogle, color: 'text-red-500' },
    { id: 'firebase', label: 'Firebase & FCM', icon: FaBell, color: 'text-amber-500' },
    { id: 'gosend', label: 'GoSend Delivery', icon: FaMotorcycle, color: 'text-emerald-600' },
    { id: 'general', label: 'Sistem & Toko', icon: FaSlidersH, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {alertMessage && (
        <MessageAlert key={alertKey} message={alertMessage} type={alertType} />
      )}

      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <FaShieldAlt /> Pengaturan Keamanan & API Key
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Integrasi & API Keys</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola kunci API 3rd-party, Gateway Pembayaran Midtrans, Google Services, dan Pengaturan Sistem.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving || loading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3 rounded-xl font-medium shadow-md shadow-indigo-100 transition-all duration-200 disabled:opacity-50"
        >
          {saving ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          ) : (
            <FaSave />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white p-2 rounded-xl shadow-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={isActive ? tab.color : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-4 text-sm font-medium">Memuat data pengaturan...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          
          {/* TAB 1: MIDTRANS */}
          {activeTab === 'midtrans' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaCreditCard className="text-blue-600" /> Midtrans Payment Gateway
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Kredensial Midtrans Snap & Core API untuk transaksi pembayaran QRIS, Bank Transfer, dan e-Wallet.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Environment Mode
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="radio"
                        name="midtransEnv"
                        checked={!configs.midtransIsProduction}
                        onChange={() => handleInputChange('midtransIsProduction', false)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Sandbox (Testing)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="radio"
                        name="midtransEnv"
                        checked={configs.midtransIsProduction}
                        onChange={() => handleInputChange('midtransIsProduction', true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Production (Live)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Webhook Payment Callback URL
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="bg-transparent flex-1 text-xs text-gray-600 font-mono outline-none"
                    />
                    <button
                      onClick={() => handleCopyText(webhookUrl, 'webhook')}
                      className="text-xs bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                    >
                      {copiedKey === 'webhook' ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                      {copiedKey === 'webhook' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Midtrans Server Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['serverKey'] ? 'text' : 'password'}
                      value={configs.midtransServerKey || ''}
                      onChange={(e) => handleInputChange('midtransServerKey', e.target.value)}
                      placeholder="SB-Mid-server-xxxxxxxxxxxx / Mid-server-xxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('serverKey')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['serverKey'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Midtrans Client Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['clientKey'] ? 'text' : 'password'}
                      value={configs.midtransClientKey || ''}
                      onChange={(e) => handleInputChange('midtransClientKey', e.target.value)}
                      placeholder="SB-Mid-client-xxxxxxxxxxxx / Mid-client-xxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('clientKey')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['clientKey'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SERVICES */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaGoogle className="text-red-500" /> Google Services Integrations
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Google OAuth Client ID untuk Login Google & Google Maps API Key untuk pencarian lokasi.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    value={configs.googleClientId || ''}
                    onChange={(e) => handleInputChange('googleClientId', e.target.value)}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Google OAuth Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['googleSecret'] ? 'text' : 'password'}
                      value={configs.googleClientSecret || ''}
                      onChange={(e) => handleInputChange('googleClientSecret', e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('googleSecret')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['googleSecret'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Google Maps API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['googleMaps'] ? 'text' : 'password'}
                      value={configs.googleMapsApiKey || ''}
                      onChange={(e) => handleInputChange('googleMapsApiKey', e.target.value)}
                      placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('googleMaps')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['googleMaps'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE */}
          {activeTab === 'firebase' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaBell className="text-amber-500" /> Firebase Cloud Messaging (FCM)
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Kredensial Firebase FCM untuk mengirimkan notifikasi pesanan masuk ke aplikasi Kasir Mobile & Kitchen Display System.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    FCM Project ID
                  </label>
                  <input
                    type="text"
                    value={configs.fcmProjectId || ''}
                    onChange={(e) => handleInputChange('fcmProjectId', e.target.value)}
                    placeholder="baraja-cashier-app"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    FCM Server Key (Legacy / Cloud Messaging API)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['fcmServerKey'] ? 'text' : 'password'}
                      value={configs.fcmServerKey || ''}
                      onChange={(e) => handleInputChange('fcmServerKey', e.target.value)}
                      placeholder="AAAAxxxxxxxx:APA91bHxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('fcmServerKey')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['fcmServerKey'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    FCM Sender ID
                  </label>
                  <input
                    type="text"
                    value={configs.fcmSenderId || ''}
                    onChange={(e) => handleInputChange('fcmSenderId', e.target.value)}
                    placeholder="123456789012"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOSEND */}
          {activeTab === 'gosend' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaMotorcycle className="text-emerald-600" /> GoSend Kurir & Delivery API
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Integrasi otomatis pengiriman pesanan antaran langsung via GoSend Driver API.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Environment Mode
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="radio"
                        name="gosendEnv"
                        checked={!configs.gosendIsProduction}
                        onChange={() => handleInputChange('gosendIsProduction', false)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Integration (Sandbox)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="radio"
                        name="gosendEnv"
                        checked={configs.gosendIsProduction}
                        onChange={() => handleInputChange('gosendIsProduction', true)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Production (Live)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    GoSend Merchant ID
                  </label>
                  <input
                    type="text"
                    value={configs.gosendMerchantId || ''}
                    onChange={(e) => handleInputChange('gosendMerchantId', e.target.value)}
                    placeholder="M-12345678"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    GoSend Client Secret / API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['gosendKey'] ? 'text' : 'password'}
                      value={configs.gosendApiKey || ''}
                      onChange={(e) => handleInputChange('gosendApiKey', e.target.value)}
                      placeholder="gosend-api-key-xxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('gosendKey')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys['gosendKey'] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaSlidersH className="text-indigo-600" /> Pengaturan Sistem & Toko
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Aturan harga diskon, persentase pajak bawaan (PPN), dan service fee operasional.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Gunakan Harga Diskon (useDiscountPrice)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Aktifkan untuk menerapkan harga promosi/diskon pada katalog menu aplikasi kasir.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(configs.useDiscountPrice)}
                      onChange={(e) => handleInputChange('useDiscountPrice', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Persentase PPN Default (%)
                    </label>
                    <input
                      type="number"
                      value={configs.defaultTaxPercentage ?? 0}
                      onChange={(e) => handleInputChange('defaultTaxPercentage', Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Persentase Service Fee Default (%)
                    </label>
                    <input
                      type="number"
                      value={configs.defaultServicePercentage ?? 0}
                      onChange={(e) => handleInputChange('defaultServicePercentage', Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-100 transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {saving ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <FaSave />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsIntegrationPage;
