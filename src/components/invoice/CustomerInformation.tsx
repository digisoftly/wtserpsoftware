import React from 'react';

export function CustomerInformation() {
  return (
    <div style={{ width: '90mm' }}>
      <h3 style={{ 
        margin: '0 0 3mm 0', 
        fontSize: '12px', 
        fontWeight: '900', 
        borderBottom: '0.3mm solid #000', 
        width: 'fit-content', 
        paddingRight: '15mm', 
        textTransform: 'uppercase' 
      }}>
        Customer Info
      </h3>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '20mm', fontWeight: 'bold', padding: '0.5mm 0' }}>Name</td>
            <td style={{ width: '4mm', textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: '900', textTransform: 'uppercase' }}>GLOBAL ENTERPRISE LTD.</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '0.5mm 0' }}>Address</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>Plot-14, Sector-07, Uttara, Dhaka-1230.</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '0.5mm 0' }}>Location</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>Dhaka</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '0.5mm 0' }}>Mobile No</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: 'bold' }}>+880 1234-567890</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
