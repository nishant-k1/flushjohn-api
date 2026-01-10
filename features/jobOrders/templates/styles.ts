const styles = `html,
  body {
    padding: 1rem;
    margin: 0;
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    }

  @page {
    margin: 1cm;
    size: letter;
  }

  a {
      color: inherit;
      text-decoration: none;
    }

  * {
      box-sizing: border-box;
    }

  h1, h2, h3, h4, h5, h6, p{
    margin: 0;
    padding: 0;
  }
  
  h1{
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  h2{
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  h3{
    font-size: 0.875rem;
    font-weight: 600;
    color: #333333;
    margin-bottom: 0.5rem;
  }

  h4{
    font-size: 0.875rem;
    font-weight: 500;
    color: #333333;
  }

  p{
    font-size: 0.875rem;
    color: #555555;
    line-height: 1.5;
  }

  hr{
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 1.5rem 0;
  }

  .logo {
    max-width: 120px !important;
    width: 120px !important;
    height: 70px !important;
    object-fit: contain !important;
    display: block !important;
  }
  
  .section-1{
    padding-bottom: 2rem;
    display: grid;
    align-items: flex-start;
    justify-content: space-between;
    grid-template-columns: auto 1fr;
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .section-1-left{
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-1-right{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    text-align: right;
  }

  .section-1-right h1{
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  .document-badge{
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #635443;
    color: #ffffff;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-1-right h3{
    font-size: 0.875rem;
    font-weight: 400;
    color: #666666;
  }


  .payment-status-badge{
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #10b981;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .section-2{
    display: grid;
    justify-content: space-between;
    align-items: start;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin: 1.5rem 0;
  }

  .section-2 h3{
    font-size: 0.875rem;
    font-weight: 600;
    color: #333333;
    margin-bottom: 0.5rem;
  }

  .section-2-left{
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: flex-start;
  }

  .section-2-right{
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: flex-start;
  }

  .section-2 p{
    font-size: 0.875rem;
    color: #555555;
    margin-bottom: 0.25rem;
  }

  .section-3 {
    padding: 1.5rem 0;
    margin: 1.5rem 0;
  }

  .section-3 h3{
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .items-heading h3{
    color: #ffffff !important;
    font-size: 0.75rem;
    font-weight: 600;
    margin: 0;
    padding: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-3 p{
    font-size: 0.875rem;
    padding: 0.75rem;
    color: #333333;
  }

  .items-heading{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    align-items: center;
    grid-template-columns: 1.5fr 2.5fr 0.75fr 0.75fr 0.75fr;
    color: #ffffff;
    background-color: #635443;
    border-radius: 4px 4px 0 0;
    position: sticky;
    top: 0;
    z-index: 10;
    page-break-inside: avoid;
  }

  .items-heading li{
    background-color: #635443;
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.75rem;
    color: #ffffff !important;
    font-weight: 600;
  }

  .items-heading li *{
    color: #ffffff !important;
  }

  .items-heading li:last-child{
    border-right: none;
  }

  .items-list{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    align-items: center;
    grid-template-columns: 1.5fr 2.5fr 0.75fr 0.75fr 0.75fr;
    border-left: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .items-list:last-of-type{
    border-bottom: 1px solid #e0e0e0;
  }

  .items-list:nth-child(even){
    background-color: #f9f9f9;
  }

  .items-list li{
    background-color: transparent;
    border-right: 1px solid #e0e0e0;
    padding: 0.75rem;
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }

  .items-list li:last-child{
    border-right: none;
  }

  .items-list li p{
    margin: 0;
    padding: 0;
  }

  .items-list li:last-child,
  .items-list li:nth-last-child(2),
  .items-list li:nth-last-child(3){
    text-align: right;
    justify-content: flex-end;
  }

  .totals-section{
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 1rem 0;
    border-top: 2px solid #e0e0e0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .total-row{
    display: flex;
    justify-content: space-between;
    width: 300px;
    padding: 0.25rem 0;
  }

  .total-row-label{
    font-size: 0.875rem;
    font-weight: 500;
    color: #555555;
  }

  .total-row-value{
    font-size: 0.875rem;
    font-weight: 600;
    color: #333333;
    text-align: right;
  }

  .total-amount-container{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 1rem 0;
    margin: 0;
    width: 100%;
    border-top: 2px solid #635443;
    margin-top: 1rem;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .total-amount-container h4{
    font-size: 1.125rem;
    font-weight: 700;
    color: #635443;
    margin: 0;
    padding: 0;
    white-space: nowrap;
  }

  .section-4{
    display: grid;
    align-items: flex-start;
    justify-content: space-between;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin: 1.5rem 0;
    padding: 1.5rem;
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .section-4 h3{
    font-size: 0.875rem;
    font-weight: 600;
    color: #333333;
    margin-bottom: 0.75rem;
  }

  .section-4 ul {
    padding-left: 1.5rem;
    margin: 0;
  }

  .section-4 ul li{
    padding: 0.375rem 0;
    font-size: 0.8125rem;
    color: #555555;
    line-height: 1.6;
  }

  .payment-terms-section{
    margin: 1.5rem 0;
    padding: 1rem;
    background-color: #f5f5f5;
    border-left: 4px solid #635443;
    border-radius: 4px;
  }

  .payment-terms-section h3{
    font-size: 0.875rem;
    font-weight: 600;
    color: #635443;
    margin-bottom: 0.5rem;
  }

  .payment-terms-section p{
    font-size: 0.8125rem;
    color: #555555;
    margin: 0.25rem 0;
  }

  .quote-expiration{
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    border-radius: 4px;
  }

  .quote-expiration p{
    font-size: 0.8125rem;
    color: #856404;
    margin: 0;
    font-weight: 500;
  }

  footer{
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
    page-break-inside: avoid;
  }

  .page-header {
    position: running(header);
  }

  .page-footer {
    position: running(footer);
  }

  @page {
    @top-center {
      content: element(header);
    }
    @bottom-center {
      content: element(footer);
      font-size: 0.75rem;
      color: #666666;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 0.75rem;
      color: #666666;
    }
  }

  footer ul{
    padding: 0;
    margin: 0;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  footer ul li{
    font-size: 0.75rem;
    color: #666666;
  }

  footer ul li a{
    color: #635443;
    text-decoration: none;
  }

  footer ul li a:hover{
    text-decoration: underline;
  }

  .page-break{
    page-break-before: always;
  }

  @media print {
    body {
      padding: 0.5rem;
    }
    
    .page-break {
      page-break-before: always;
    }
  }
`;

export default styles;
