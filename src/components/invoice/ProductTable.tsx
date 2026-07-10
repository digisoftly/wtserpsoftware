import React from 'react';

export function ProductTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #000' }}>
          <th style={{ borderRight: '1px solid #000', padding: '5px', width: '40px' }}>SL</th>
          <th style={{ borderRight: '1px solid #000', padding: '5px', width: '50%', textAlign: 'left' }}>PRODUCT NAME / DESCRIPTION</th>
          <th style={{ borderRight: '1px solid #000', padding: '5px', width: '80px' }}>QTY(UNIT)</th>
          <th style={{ borderRight: '1px solid #000', padding: '5px', width: '100px' }}>UNIT PRICE</th>
          <th style={{ borderRight: '1px solid #000', padding: '5px', width: '80px' }}>DISCOUNT</th>
          <th style={{ padding: '5px', textAlign: 'right' }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ height: '30px', borderBottom: '1px solid #eee' }}>
          <td style={{ borderRight: '1px solid #000', textAlign: 'center' }}>01</td>
          <td style={{ borderRight: '1px solid #000', padding: '5px' }}>[PRODUCT DETAILS]</td>
          <td style={{ borderRight: '1px solid #000', textAlign: 'center' }}>0</td>
          <td style={{ borderRight: '1px solid #000', textAlign: 'right', paddingRight: '5px' }}>0.00</td>
          <td style={{ borderRight: '1px solid #000', textAlign: 'right', paddingRight: '5px' }}>0.00</td>
          <td style={{ textAlign: 'right', paddingRight: '5px' }}>0.00</td>
        </tr>
        {/* Repeating rows as needed */}
      </tbody>
      <tfoot>
        {/* Integrated Payment Summary in Table Footer */}
        <tr>
          <td colSpan={4} style={{ borderRight: '1px solid #000', borderTop: '1px solid #000', padding: '10px', verticalAlign: 'top' }}>
            <div style={{ fontWeight: 'bold' }}>AMOUNT IN WORDS:</div>
            <div style={{ fontStyle: 'italic', fontSize: '11px' }}>[ZERO BDT ONLY]</div>
          </td>
          <td style={{ borderRight: '1px solid #000', borderTop: '1px solid #000', padding: '5px', fontSize: '12px' }}>
            <div>SUB TOTAL</div>
            <div>DISCOUNT</div>
            <div>VAT</div>
            <div style={{ fontWeight: 'bold' }}>GRAND TOTAL</div>
            <div>PAID</div>
            <div style={{ color: 'red' }}>DUE</div>
          </td>
          <td style={{ borderTop: '1px solid #000', padding: '5px', textAlign: 'right', fontSize: '12px' }}>
            <div>0.00</div>
            <div>0.00</div>
            <div>0.00</div>
            <div style={{ fontWeight: 'bold' }}>0.00</div>
            <div>0.00</div>
            <div style={{ color: 'red' }}>0.00</div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
