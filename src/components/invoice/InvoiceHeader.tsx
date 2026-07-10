import React from 'react';

export function InvoiceHeader() {
  return (
    <header style={{ height: '100px', width: '100%', borderBottom: '1px solid #eee' }}>
      <div style={{ float: 'left' }}>
        [COMPANY LOGO PLACEHOLDER]
      </div>
      <div style={{ float: 'right', textAlign: 'right' }}>
        [COMPANY CONTACT DETAILS]
      </div>
      <div style={{ clear: 'both' }}></div>
    </header>
  );
}
