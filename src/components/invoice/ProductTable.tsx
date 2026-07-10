import React from 'react';

export function ProductTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
      <thead>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <th style={{ border: '1px solid #000', padding: '8px', width: '40px', fontSize: '11px' }}>SL</th>
          <th style={{ border: '1px solid #000', padding: '8px', width: '50%', textAlign: 'left', fontSize: '11px' }}>PRODUCT NAME / DESCRIPTION</th>
          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '11px' }}>QTY(UNIT)</th>
          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>UNIT PRICE</th>
          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>DISCOUNT</th>
          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ minHeight: '30px' }}>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '11px' }}>01</td>
          <td style={{ border: '1px solid #000', padding: '8px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold' }}>[PRODUCT NAME]</div>
            <div style={{ fontSize: '10px' }}>[BRAND / MODEL / WARRANTY]</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '11px' }}>0 [UNIT]</td>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>0.00</td>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>0.00</td>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>0.00</td>
        </tr>
        {/* Placeholder for empty space to fill A4 */}
        <tr style={{ height: '200px' }}>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
        </tr>
      </tbody>
      <tfoot>
        {/* Payment Summary integrated into table footer */}
        <tr>
          <td colSpan={4} style={{ border: '1px solid #000', padding: '10px', verticalAlign: 'top' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>AMOUNT IN WORDS:</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic' }}>[ZERO BDT ONLY]</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '5px', fontSize: '11px', fontWeight: 'bold' }}>
            <div>SUB TOTAL</div>
            <div>DISCOUNT</div>
            <div>VAT</div>
            <div style={{ marginTop: '5px', borderTop: '1px solid #000', paddingTop: '5px' }}>GRAND TOTAL</div>
            <div>PAID</div>
            <div style={{ color: 'red' }}>DUE</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontSize: '11px' }}>
            <div>0.00</div>
            <div>0.00</div>
            <div>0.00</div>
            <div style={{ marginTop: '5px', borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>0.00</div>
            <div>0.00</div>
            <div style={{ color: 'red', fontWeight: 'bold' }}>0.00</div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
