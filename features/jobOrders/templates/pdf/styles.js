const styles = `html,
  body {
    padding: 1rem;
    margin: 0;
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
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
  
  h3{
    font-size: medium;
  }

  p{
    font-size: medium;
  }

  .logo {
    max-width: 80px !important;
    width: 80px !important;
    height: 40px !important;
    object-fit: contain !important;
    display: block !important;
  }
  
  .section-1-left img.logo {
    max-width: 80px !important;
    width: 80px !important;
    height: 40px !important;
    object-fit: contain !important;
  }
  .section-1{
    border-top: 1px solid black
    padding-bottom: 24px;
    display: grid;
    align-items: start;
    justify-content: space-between;
    grid-template-columns: repeat(2, max-content);
  }

  .section-1-left {
    display: grid;
    align-items: start;
    row-gap: 24px;
  }
  .section-1-left div {
    display: grid;
    row-gap: 2px;
  }
  strong {
    font-weight: 900;
    font-size: 14px;
    color: black;
  }
  .section-1-left img {
    margin: 0;
    padding: 0;
  }
  
  .section-1-left img.logo {
    max-width: 80px !important;
    width: 80px !important;
    height: 40px !important;
    object-fit: contain !important;
  }
  .section-1-right{
    display: grid;
    row-gap: 4px;
  }

  .section-1-right h1{
    font-size: x-large;
  }
  
  .section-2{
    display: grid;
    justify-content: space-between;
    align-items: start;
    grid-template-columns: repeat(2, max-content);
  }
  .section-2 h3{
    font-size: medium;
  }

  h4{
    font-size: small;
    color: #ef648a;
  }

  .section-2-left{
    display: grid;
    row-gap: 1rem;
    align-items: start;
  }

  .section-2-right{
    display: grid;
    row-gap: 1rem;
    align-items: start;
    grid-template-rows: repeat(2, min-content);
  }

  .section-3 {
    padding: 2rem 0;
  }

  .section-3 h3{
    font-size: small;
    padding: .5rem;
  }

  .section-3 p{
    font-size: small;
    padding-top: .2rem;
    padding-bottom: .2rem;
    padding-left: .5rem;
  }

  .section-3 div{
    justify-self: right;
    list-style: none;
    padding: 1rem 0;
    margin: 0;
    display: grid;
    align-items: center;
    justify-content: right;
    column-gap: 0;
    grid-template-columns: repeat(2, max-content)
  }

  .section-3 div h4{
    font-size: medium;
    color: red;
  }

  .items-heading{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    align-items: center;
    justify-content: space-between;
    grid-template-columns: 1.5fr 2.5fr .5fr .5fr .5fr;
    color: white;
  }

  .items-heading li{
    background-color: #002B4C;
    border: solid 1px white
  }

  .items-list{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    align-items: center;
    justify-content: space-between;
    grid-template-columns: 1.5fr 2.5fr .5fr .5fr .5fr;
  }

  .items-list li{
    background-color: #F3F3F3;
    border: solid 1px white;
    height: 100%;
  }
  .section-4 ul {
    padding-left: 2rem;
  }

  .section-4 h3{
    font-size: small;
  }
  .section-4 ul li{
    padding: .2rem;
    font-size: 11px;
  }

  footer ul{
    bottom:0;
    padding: 0;
    margin-top: 4rem;
    list-style: none;
    display: grid;
    justify-content: space-between;
    align-items: bottom;
    grid-template-columns: repeat(3, max-content);
    color: blue;
    font-size: smaller;
  }
`;

export default styles;
