function component() {
    const element = document.createElement('div');

    element.innerHTML = ['Hello', 'webpfdsfack'].join(' ')
    console.log(element)
    return element;
}

document.body.appendChild(component());
