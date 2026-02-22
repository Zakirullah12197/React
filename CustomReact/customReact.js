// function customRender(reactElement, container){
//     /*
//     const domElement = document.createElement(reactElement.type)
//     domElement.innerHTML = reactElement.children
//     domElement.setAttribute('href', reactElement.props.href)
//     domElement.setAttribute('target', reactElement.props.target)

//     const { Children } = require("react");

//     container.appendChild(domElement)
//     */


//     const domElement = document.createElement(reactElement.type)
//     domElement.innerHTML = reactElement.children
//     for (const prop in reactElement.props) {
//         if (prop === 'children') continue;
//         domElement.setAttribute(prop, reactElement.props[prop])
//     }
//     container.appendChild(domElement)
// }

// const reactElement = {
//     type: 'a',
//     props: {
//         href: 'https://google.com',
//         target: '_blank'
//     },
//     children: 'Click me to visit google'
// }

// const mainContainer = document.querySelector('#root')

// customRender(reactElement, mainContainer)
// function customRender(reactElement, mainContainer) {
//     const domElement = document.createElement(reactElement.type);
//     domElement.innerHTML = reactElement.children
//     domElement.setAttribute('href', reactElement.props.href)
//     domElement.setAttribute('target', reactElement.props.target)
//     mainContainer.appendChild(domElement)
// }
function customRender(reactElement, mainContainer) {
    const domElement = document.createElement(reactElement.type);
    domElement.innerHTML = reactElement.children;
    for (const prop in reactElement.props) {
        if (prop === 'children') continue;
        domElement.setAttribute(prop,reactElement.props[prop]);
    }
    mainContainer.appendChild(domElement);
}
const mainContainer = document.querySelector('#root');
const reactElement = {
    type: 'a',
    props: {
        href: 'https://google.com',
        target: '_blank'
    },
    children: `Click me i am the element`
}
customRender(reactElement, mainContainer);