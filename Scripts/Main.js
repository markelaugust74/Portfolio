// Adjust this value to control the scroll offset (in pixels)
const scrollOffset = 20; // Increase this number to add more space at the top

let lastScrollTop = 0;
const leftPanel = document.getElementById('LeftPanel');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (window.innerWidth <= 768) {  // Only on mobile
        if (scrollTop > lastScrollTop && scrollTop > 50) {
            // Scrolling down & past threshold
            leftPanel.classList.add('hide');
        } else {
            // Scrolling up or at top
            leftPanel.classList.remove('hide');
        }
    }
    
    lastScrollTop = scrollTop;
});

const mouseGlow = document.getElementById('MouseGlow');
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;



document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

// Smoothly animate the glow effect
function updateGlowPosition() {
    // Smoothing factor - lower = smoother but slower
    const smoothing = 0.1;
    
    // Calculate new position with easing
    currentX += (targetX - currentX) * smoothing;
    currentY += (targetY - currentY) * smoothing;
    
    // Update glow position
    mouseGlow.style.left = `${currentX}px`;
    mouseGlow.style.top = `${currentY}px`;
    
    // Continue animation
    requestAnimationFrame(updateGlowPosition);
}
updateGlowPosition();


document.querySelectorAll('.NavItem').forEach(navItem => {
    navItem.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get the section ID from the DataSection attribute
        const targetId = this.getAttribute('DataSection');
        const targetElement = document.getElementById(targetId);
        const rightPanel = document.getElementById('RightPanel');
        
        // Calculate the target scroll position relative to the right panel
        const targetPosition = targetElement.offsetTop;
        
        // Smooth scroll the right panel, using the scrollOffset variable
        rightPanel.scrollTo({
            top: targetPosition - scrollOffset,
            behavior: 'smooth'
        });

        // Add active state to clicked nav item
        document.querySelectorAll('.NavItem').forEach(item => {
            item.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// Optional: Add scroll spy to highlight current section
document.getElementById('RightPanel').addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.Section');
    const navItems = document.querySelectorAll('.NavItem');
    const rightPanel = document.getElementById('RightPanel');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - scrollOffset - 80; // Added offset here too for consistency
        const sectionHeight = section.clientHeight;
        if (rightPanel.scrollTop >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('DataSection') === current) {
            item.classList.add('active');
        }
    });
});