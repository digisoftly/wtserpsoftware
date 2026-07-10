import React from 'react';

export function ProductTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
      <thead>
        <tr style={{ backgroundColor: '#eeeeee' }}>
          <th style={{ border: '1px solid #000', padding: '4px', width: '30px', fontSize: '10px', fontWeight: 'bold' }}>SL</th>
          <th style={{ border: '1px solid #000', padding: '4px', width: '50%', textAlign: 'left', fontSize: '10px', fontWeight: 'bold' }}>PRODUCT NAME / DESCRIPTION</th>
          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>QTY(UNIT)</th>
          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold' }}>UNIT PRICE</th>
          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold' }}>DISCOUNT</th>
          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold' }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ minHeight: '25px' }}>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>01</td>
          <td style={{ border: '1px solid #000', padding: '4px' }}>
            <div style={{ fontWeight: 'bold' }}>High Definition CCTV Camera 2MP</div>
            <div style={{ fontSize: '9px' }}>Hikvision / DS-2CE / 1 Year Warranty</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>4 Pcs</td>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>2,500.00</td>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>200.00</td>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>9,800.00</td>
        </tr>
        {/* Fillers to maintain height consistency */}
        <tr style={{ height: '150px' }}>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
          <td style={{ border: '1px solid #000' }}></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Amount in words:</div>
            <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '5px' }}>NINE THOUSAND EIGHT HUNDRED BDT ONLY.</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
            <div>SUB TOTAL</div>
            <div>DISCOUNT</div>
            <div>VAT (15%)</div>
            <div style={{ marginTop: '3px', borderTop: '1px solid #000', paddingTop: '3px', fontSize: '11px' }}>GRAND TOTAL</div>
            <div style={{ color: 'green' }}>PAID</div>
            <div style={{ color: 'red' }}>DUE</div>
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontSize: '10px', backgroundColor: '#f9f9f9' }}>
            <div>10,000.00</div>
            <div>200.00</div>
            <div>0.00</div>
            <div style={{ marginTop: '3px', borderTop: '1px solid #000', paddingTop: '3px', fontWeight: 'bold', fontSize: '11px' }}>9,800.00</div>
            <div style={{ color: 'green', fontWeight: 'bold' }}>9,800.00</div>
            <div style={{ color: 'red', fontWeight: 'bold' }}>0.00</div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
