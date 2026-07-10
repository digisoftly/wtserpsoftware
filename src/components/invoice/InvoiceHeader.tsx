import React from 'react';

export function InvoiceHeader() {
  return (
    <header style={{ height: '120px', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>[COMPANY LOGO PLACEHOLDER]</div>
              <div style={{ fontSize: '14px' }}>WARRIOR TECH SYSTEM</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic' }}>Innovative Security, Reliable Communication</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '11px' }}>
              <div>[ADDRESS LINE 1]</div>
              <div>[ADDRESS LINE 2]</div>
              <div>[PHONE]</div>
              <div>[EMAIL]</div>
              <div>[WEBSITE]</div>
            </td>
          </tr>
        </tbody>
      </table>
    </header>
  );
}
