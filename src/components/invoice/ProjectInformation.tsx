import React from 'react';

export function ProjectInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '10px' }}>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>PROJECT INFORMATION:</h4>
      <div style={{ fontSize: '11px' }}>
        <div>PROJECT NAME: [PROJECT]</div>
        <div>QUOTATION REF: [REF]</div>
        <div>CHALLAN REF: [REF]</div>
      </div>
    </section>
  );
}
