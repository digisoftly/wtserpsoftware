import React from 'react';

export function RemarksSection() {
  return (
    <section style={{ border: '1px solid #000', padding: '8px' }}>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Remarks / Terms & Conditions:</h4>
      <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
        <div>1. Warranty valid from date of installation.</div>
        <div>2. Payment strictly on delivery or as per contract.</div>
        <div>3. Goods once sold are not returnable.</div>
      </div>
    </section>
  );
}
