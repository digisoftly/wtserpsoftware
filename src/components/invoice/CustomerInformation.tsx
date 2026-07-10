import React from 'react';

export function CustomerInformation() {
  return (
    <section>
      <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '5px' }}>CUSTOMER INFORMATION</h3>
      <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
        <div>NAME: [NAME]</div>
        <div>COMPANY: [COMPANY]</div>
        <div>ADDRESS: [ADDRESS]</div>
        <div>MOBILE: [MOBILE]</div>
      </div>
    </section>
  );
}
