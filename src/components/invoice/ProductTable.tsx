import React from 'react';

/**
 * Locked Product Table Specifications:
 * Total Width: 190mm
 * Columns: SL(10), Desc(92), Qty(18), Price(25), Disc(15), Amt(30)
 * Integrated Summary Cell Height: 8mm
 */
export function ProductTable() {
  return (
    <div style={{ width: '190mm', marginTop: '5mm' }}>
      {/* Visual Banners */}
      <div style={{ backgroundColor: '#FDEBD0', border: '0.3mm solid #000', padding: '1.5mm', textAlign: 'center', borderBottom: 'none' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          Implementation and Cost Summary
        </h3>
      </div>
      <div style={{ backgroundColor: '#D5F5E3', border: '0.3mm solid #000', padding: '1.2mm', textAlign: 'center', borderBottom: 'none' }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#155724', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
          Budgeted Proposal on Network Solution and CCTV.
        </p>
      </div>

      <table style={{ width: '190mm', borderCollapse: 'collapse', border: '0.3mm solid #000', tableLayout: 'fixed', fontFamily: 'inherit' }}>
        <thead>
          <tr style={{ backgroundColor: '#F57C00', color: '#ffffff' }}>
            <th style={{ border: '0.3mm solid #000', width: '10mm', height: '9mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Sl. No</th>
            <th style={{ border: '0.3mm solid #000', width: '92mm', textAlign: 'left', padding: '0 3mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Product Name and Description</th>
            <th style={{ border: '0.3mm solid #000', width: '18mm', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Qty (Unit)</th>
            <th style={{ border: '0.3mm solid #000', width: '25mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Unit Price</th>
            <th style={{ border: '0.3mm solid #000', width: '15mm', textAlign: 'center', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Discount</th>
            <th style={{ border: '0.3mm solid #000', width: '30mm', textAlign: 'right', paddingRight: '3.5mm', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* Main Item Row - Fixed min-height 80mm */}
          <tr style={{ height: '80mm' }}>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '3mm 0', fontSize: '12px', fontWeight: 'bold' }}>01</td>
            <td style={{ border: '0.3mm solid #000', verticalAlign: 'top', padding: '3mm 3mm' }}>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 1.5mm 0' }}><span style={{ fontWeight: 'bold' }}>Product Name:</span> <span style={{ fontWeight: '900', textTransform: 'uppercase' }}>Sony 4K Ultra HD IP Camera</span></p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Brand:</span> Sony Professional</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Model:</span> SNC-VB770</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Country of Origin:</span> Japan</p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Warranty:</span> 24 Months</p>
              </div>
            </td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '3mm 0', fontSize: '12px', fontWeight: 'bold' }}>05 (Pcs)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', verticalAlign: 'top', padding: '3mm 2.5mm', fontSize: '12px', fontWeight: 'bold' }}>42,500.00</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'center', verticalAlign: 'top', padding: '3mm 0', fontSize: '12px', fontWeight: 'bold' }}>0</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', verticalAlign: 'top', padding: '3mm 3.5mm', fontSize: '12px', fontWeight: '900' }}>212,500.00</td>
          </tr>

          {/* Integrated Summary Matrix */}
          <tr>
            <td colSpan={3} rowSpan={6} style={{ border: '0.3mm solid #000', padding: '5mm', verticalAlign: 'top', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '4mm' }}>In Word Amount:</div>
              <div style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 'bold', color: '#444', lineHeight: '1.4' }}>Two Hundred Twelve Thousand Five Hundred BDT Only.</div>
            </td>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '11px', fontWeight: '900', backgroundColor: '#FFC107', textTransform: 'uppercase' }}>Sub Total (BDT)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '12px', fontWeight: '900' }}>212,500.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '11px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>Discount (BDT)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '12px', fontWeight: 'bold' }}>0.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '11px', fontWeight: '900', backgroundColor: '#D6EAF8', textTransform: 'uppercase' }}>VAT (15%)</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '12px', fontWeight: 'bold' }}>31,875.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '13px', fontWeight: '900', backgroundColor: '#AED6F1', textTransform: 'uppercase' }}>Grand Total</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '14px', fontWeight: '900', color: '#0056B3' }}>244,375.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '11px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Paid</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '12px', fontWeight: '900', color: '#155724' }}>244,375.00</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '0.3mm solid #000', height: '8mm', textAlign: 'right', paddingRight: '2.5mm', fontSize: '11px', fontWeight: '900', backgroundColor: '#D5F5E3', textTransform: 'uppercase' }}>Due</td>
            <td style={{ border: '0.3mm solid #000', textAlign: 'right', paddingRight: '3.5mm', fontSize: '12px', fontWeight: '900', color: '#721C24' }}>0.00</td>
          </tr>
        </tbody>
      </table>
      <div style={{ backgroundColor: '#FEF9E7', borderLeft: '0.3mm solid #000', borderRight: '0.3mm solid #000', borderBottom: '0.3mm solid #000', padding: '1.5mm', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold' }}>
          Note: The entries payable amount is excluding VAT
        </p>
      </div>
    </div>
  );
}
