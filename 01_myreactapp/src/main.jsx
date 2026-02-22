import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'

function MyApp() {
  return (<div>
    hello world
  </div>)
}
// const ReactElement = {
//   type: 'a',
//   props: {
//     href: 'https://google.com',
//     target: '_blank'
//   },
//   children: `Click me i am the element`
// }
const hi = (<div>
  hello world
</div>);
const name='ali'
const reactElement = React.createElement(
  'a',
  {href:'https://www.google.com',target:'_blank'},
  'click me ',
  name
);
createRoot(document.getElementById('root')).render(
  // <StrictMode>
  // </StrictMode>
  reactElement
)
