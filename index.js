// Function to generate a random hex color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Apply random color on hover
const links = document.querySelectorAll('nav ul li a');
links.forEach(link => {
    link.addEventListener('mouseover', function() {
        const randomColor = getRandomColor();
        this.style.backgroundColor = randomColor;
    });
    link.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#F5F5F5'; // Reset to initial background
    });
});