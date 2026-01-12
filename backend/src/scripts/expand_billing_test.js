// Quick local test for billing period expansion logic used by /api/invoices/:id/download
const samples = [
  { raw: 'Dec 2025' },
  { raw: 'December 2025' },
  { raw: '1st to 30th November 2025' },
  { raw: '' , generatedDate: '2025-12-10' },
  { raw: null, generatedDate: '2025-11-15' },
  { raw: 'Nov 2024' }
];

function expand(raw, generatedDate) {
  let billingPeriodRaw = raw || '';
  let billingPeriodExpanded = billingPeriodRaw;
  try {
    if (!billingPeriodRaw || !/\d+\s*to\s*\d+/i.test(billingPeriodRaw)) {
      const m = (billingPeriodRaw || '').match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]*([0-9]{4})/i);
      if (m) {
        const monthName = m[1];
        const year = Number(m[2]);
        const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const monthIndex = monthAbbr.findIndex((abbr, idx) => new RegExp('^'+abbr,'i').test(monthName) || new RegExp('^'+monthFull[idx],'i').test(monthName));
        if (monthIndex >= 0) {
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          billingPeriodExpanded = `1st to ${daysInMonth} ${monthFull[monthIndex]} ${year}`;
        }
      } else if (generatedDate) {
        const d = new Date(generatedDate);
        const prev = new Date(d.getFullYear(), d.getMonth(), 1);
        const days = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
        const monthFull = prev.toLocaleString('default', { month: 'long' });
        billingPeriodExpanded = `1st to ${days} ${monthFull} ${prev.getFullYear()}`;
      }
    }
  } catch (err) { /* ignore */ }
  return billingPeriodExpanded;
}

for (const s of samples) {
  console.log('raw:', JSON.stringify(s.raw), 'generatedDate:', s.generatedDate, '->', expand(s.raw, s.generatedDate));
}
