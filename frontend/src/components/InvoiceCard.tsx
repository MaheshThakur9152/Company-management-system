import React from 'react';

type Invoice = {
  _id: string;
  invoiceNo: string;
  client?: { name?: string };
  amount?: number;
};

const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoice._id}/download`, {
        method: 'GET'
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `Invoice_${invoice.invoiceNo.replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading bill:', err);
      alert('Failed to download bill');
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <h4 className="font-semibold">{invoice.client?.name || 'Client'}</h4>
      <p>Invoice: {invoice.invoiceNo}</p>
      <p>Total: ₹{invoice.amount ?? '—'}</p>
      <button onClick={handleDownload} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
        Download Excel Bill
      </button>
    </div>
  );
};

export default InvoiceCard;
