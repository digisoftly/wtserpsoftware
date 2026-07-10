import React from 'react';

export function InvoiceInformation() {
  return (
    <section>
      <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '5px' }}>INVOICE INFORMATION</h3>
      <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
        <div>INVOICE NO: [INV-000]</div>
        <div>DATE: [DATE]</div>
        <div>DUE DATE: [DUE DATE]</div>
        <div>STATUS: [STATUS]</div>
      </div>
    </section>
  );
}
