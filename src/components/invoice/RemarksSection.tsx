import React from 'react';

export function RemarksSection() {
  return (
    <div style={{ width: '190mm', border: '0.3mm solid #000', padding: '2mm 4mm', margin: '0 auto' }}>
      <h4 style={{ margin: '0 0 1.5mm 0', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Remarks / Terms & Conditions:</h4>
      <div style={{ fontSize: '9px', lineHeight: '1.4', color: '#444' }}>
        <div>1. Equipment remains property of Warrior Tech System until full payment is realized.</div>
        <div>2. Warranty strictly covers manufacturing defects; physical or electrical damage excluded.</div>
        <div>3. Delivery timelines are subject to site readiness and administrative approvals.</div>
      </div>
    </div>
  );
}
