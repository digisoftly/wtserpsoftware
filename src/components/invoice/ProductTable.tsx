import React from 'react';

export function ProductTable() {
  return (
    <div style={{ width: '190mm', margin: '0 auto' }}>
      {/* Banners */}
      <div style={{ backgroundColor: '#FDEBD0', border: '0.3mm solid #000', padding: '2mm', textAlign: 'center', marginBottom: '0.1mm' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Implementation and Cost Summary
        </h3>
      </div>
      <div style={{ backgroundColor: '#D5F5E3', borderLeft: '0.3mm solid #000', borderRight: '0.3mm solid #000', borderBottom: '0.3mm solid #000', padding: '1.5mm', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: '#155724', textTransform: 'uppercase' }}>
          Budgeted Proposal on Network Solution and CCTV.
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.3mm solid #000' }}>
        <thead>
          <tr style={{ backgroundColor: '#F57C00', color: '#ffffff' }}>
            <th style={{ border: '0.3mm solid #000', width: '12mm', height: '8mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Sl. No</th>
            <th style={{ border: '0.3mm solid #000', width: '95mm', textAlign: 'left', padding: '0 3mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Product Name and Description</th>
            <th style={{ border: '0.3mm solid #000', width: '22mm', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Qty (Unit)</th>
            <th style={{ border: '0.3mm solid #000', width: '25mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Unit Price</th>
            <th style={{ border: '0.3mm solid #000', width: '18mm', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Discount</th>
            <th style={{ border: '0.3mm solid #000', width: '28mm', textAlign: 'right', paddingRight: '3mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: '70mm' }}>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '2mm 0', fontSize: '11px', fontWeight: 'bold' }}>01</td>
            <td style={{ border: '0.3mm solid #000', verticalAlign: 'top', padding: '2mm 3mm' }}>
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <p style={{ margin: '0 0 1mm 0' }}><span style={{ fontWeight: 'bold' }}>Product Name:</span> <span style={{ fontWeight: '900', textTransform: 'uppercase' }}>Sony 4K Ultra HD IP Camera</span></p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Brand:</span> Sony Professional</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Model:</span> SNC-VB770</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Country of Origin:</span> Japan</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Warranty:</span> 24 Months</p>
              </div>
            </td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '2mm 0', fontSize: '11px', fontWeight: 'bold' }}>05 (Pcs)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', verticalAlign: 'top', padding: '2mm 2mm', fontSize: '11px', fontWeight: 'bold' }}>42,500.00</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '2mm 0', fontSize: '11px', fontWeight: 'bold' }}>0</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', verticalAlign: 'top', padding: '2mm 3mm', fontSize: '11px', fontWeight: '900' }}>212,500.00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} rowSpan={6} style={{ border: '0.3mm solid #000', padding: '4mm', verticalAlign: 'top' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '3mm' }}>In Word Amount:</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', color: '#555' }}>Two Hundred Twelve Thousand Five Hundred BDT Only.</div>
            </td>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '6mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', backgroundColor: '#FFC107', textTransform: 'uppercase' }}>Sub Total (BDT)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '11px', fontWeight: '900' }}>212,500.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '6mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>Discount (BDT)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '11px', fontWeight: 'bold' }}>0.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '6mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>VAT (15%)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '11px', fontWeight: 'bold' }}>31,875.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2mm', fontSize: '12px', fontWeight: '900', backgroundColor: '#AED6F1', textTransform: 'uppercase' }}>Grand Total</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '13px', fontWeight: '900', color: '#0056B3' }}>244,375.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '6mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Paid</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '11px', fontWeight: '900', color: '#155724' }}>244,375.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '6mm', textAlign: 'right', paddingRight: '2mm', fontSize: '10px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Due</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3mm', fontSize: '11px', fontWeight: '900', color: '#721C24' }}>0.00</td>
          </tr>
        </tfoot>
      </table>
      <div style={{ backgroundColor: '#FEF9E7', borderLeft: '0.3mm solid #000', borderRight: '0.3mm solid #000', borderBottom: '0.3mm solid #000', padding: '1.5mm', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic' }}>
          Note: The entries payable amount is including all taxes.
        </p>
      </div>
    </div>
  );
}
