import React from 'react';

export function ProductTable() {
  return (
    <div style={{ width: '100%', marginTop: '10px' }}>
      {/* Implementation Banners */}
      <div style={{ backgroundColor: '#FDEBD0', border: '1px solid #000', padding: '6px', textAlign: 'center', marginBottom: '1px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          Implementation and Cost Summary
        </h3>
      </div>
      <div style={{ backgroundColor: '#D5F5E3', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '4px', textAlign: 'center', marginBottom: '0' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: '#155724', textTransform: 'uppercase' }}>
          Budgeted Proposal on Network Solution and CCTV.
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <thead>
          <tr style={{ backgroundColor: '#F57C00', color: '#ffffff' }}>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '40px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Sl. No</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Product Name and Description</th>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '80px', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Qty (Unit)</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '100px', textAlign: 'right', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Unit Price</th>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '80px', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Discount</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '120px', textAlign: 'right', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ minHeight: '80px' }}>
            <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold' }}>01</td>
            <td style={{ border: '1px solid #000', padding: '8px 10px', verticalAlign: 'top' }}>
              <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Product Name:</span> <span style={{ fontWeight: '900', textTransform: 'uppercase' }}>Sample Product 4K HD Camera</span></p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Brand:</span> Hikvision</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Model:</span> DS-2CE-SAMPLE</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Country of Origin:</span> China</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Warranty:</span> 12 Months</p>
              </div>
            </td>
            <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold' }}>2 (Pcs)</td>
            <td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>4,500.00</td>
            <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold' }}>0</td>
            <td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'right', verticalAlign: 'top', fontWeight: '900' }}>9,000.00</td>
          </tr>
          {/* Fillers to maintain height consistency */}
          <tr style={{ height: '120px' }}>
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
            <td colSpan={3} rowSpan={6} style={{ border: '1px solid #000', padding: '15px', verticalAlign: 'top', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '10px' }}>In Word Amount:</div>
              <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold', color: '#666' }}>Nine Thousand BDT Only.</div>
            </td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', backgroundColor: '#FFC107', textTransform: 'uppercase' }}>Sub Total (BDT)</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: '900' }}>9,000.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>Discount (BDT)</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>0.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>VAT</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>0.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '900', backgroundColor: '#AED6F1', textTransform: 'uppercase' }}>Grand Total</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '14px', fontWeight: '900', color: '#0056B3' }}>9,000.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Paid</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: '#155724' }}>9,000.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Due</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: '#721C24' }}>0.00</td>
          </tr>
        </tfoot>
      </table>
      <div style={{ backgroundColor: '#FEF9E7', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '4px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic' }}>
          Note: The entries payable amount is excluding VAT
        </p>
      </div>
    </div>
  );
}
