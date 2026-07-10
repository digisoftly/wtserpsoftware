import React from 'react';

export function ProductTable() {
  return (
    <section>
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Product Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>01</td>
            <td>
              <div>Product Name</div>
              <div>Brand / Model</div>
              <div>Country / Warranty</div>
            </td>
            <td>0</td>
            <td>0.00</td>
            <td>0.00</td>
            <td>0.00</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
