function changeActive(elem) {
    const buttons = [...elem.parentElement.children];

    buttons.forEach(item => item.classList.remove('active'));
    elem.classList.add('active');
}