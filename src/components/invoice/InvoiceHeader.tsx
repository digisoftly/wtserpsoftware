import React from 'react';

export function InvoiceHeader() {
  return (
    <header style={{ height: '95px', width: '100%', marginBottom: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '30%' }}>
              <div style={{ border: '1px solid #000', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifySelf: 'center', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                LOGO
              </div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '2px' }}>WARRIOR TECH SYSTEM</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic' }}>Innovative Security, Reliable Communication</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '10px', width: '30%' }}>
              <div style={{ fontWeight: 'bold' }}>Address Line 1, Dhaka, Bangladesh</div>
              <div>Phone: +880 17XX XXXXXX</div>
              <div>Email: info@warriortech.com</div>
              <div>Website: www.warriortech.com</div>
            </td>
          </tr>
        </tbody>
      </table>
    </header>
  );
}
