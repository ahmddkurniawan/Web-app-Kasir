export function getDeviceId(): string {
  let id = localStorage.getItem('ngopay_device_id');
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('ngopay_device_id', id);
  }
  return id;
}

export function getDeviceName(): string {
  let name = localStorage.getItem('ngopay_device_name');
  if (!name) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle)/i.test(navigator.userAgent);
    
    if (isTablet) name = 'Tablet Kasir';
    else if (isMobile) name = 'HP Kasir';
    else name = 'Laptop Kasir Utama';
    
    localStorage.setItem('ngopay_device_name', name);
  }
  return name;
}

export function setDeviceName(newName: string) {
  localStorage.setItem('ngopay_device_name', newName);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateTransactionNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${randomSuffix}`;
}
