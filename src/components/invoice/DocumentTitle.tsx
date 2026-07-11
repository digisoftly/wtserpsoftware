import React from 'react';

/**
 * Locked Document Title:
 * Top Margin from divider: 7mm
 */
export function DocumentTitle() {
  return (
    <div style={{ textAlign: 'center', width: '190mm', marginTop: '7mm' }}>
      <h2 style={{ 
        margin: 0, 
        fontSize: '24px', 
        textTransform: 'uppercase', 
        fontWeight: '900', 
        textDecoration: 'underline',
        textUnderlineOffset: '8px',
        decorationThickness: '1.5px',
        color: '#222',
        fontFamily: 'inherit'
      }}>
        Price List / Quotation
      </h2>
    </div>
  );
}
